export const dynamic = 'force-dynamic'
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { bucketPath, userId, name } = await req.json();

    // 1. Baixar a imagem do Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("workout-sheets")
      .download(bucketPath);

    if (downloadError || !fileData) {
      throw downloadError || new Error("Falha ao baixar imagem do storage");
    }

    // 2. Converter para base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fileData.type || "image/jpeg";

    // 3. Chamar Gemini via REST API v1 diretamente (sem SDK)
    const prompt = `Você é um especialista em leitura de fichas de treino de academia.
Analise esta imagem e extraia TODOS os exercícios presentes.
Agrupe por dia/treino (ex: "TREINO A", "TREINO B") se houver divisão.
Se não houver divisão, use "TREINO COMPLETO" como label.

Retorne APENAS um JSON válido com esta estrutura exata (sem markdown, sem explicações):
{
  "days": [
    {
      "label": "TREINO A",
      "exercises": [
        {
          "name": "Nome do exercício",
          "sets": 3,
          "reps": "12",
          "rest_seconds": "60"
        }
      ]
    }
  ]
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(errBody);
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const resultText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const workoutData = JSON.parse(resultText);

    // 4. Salvar no Supabase
    const { data: sheet, error: sheetError } = await supabase
      .from("training_sheets")
      .insert({
        user_id: userId,
        name: name || "Ficha Importada",
        ocr_raw_text: resultText,
        source: "ocr",
      })
      .select()
      .single();

    if (sheetError) throw sheetError;

    for (const day of workoutData.days) {
      const { data: dayRow } = await supabase
        .from("training_days")
        .insert({
          sheet_id: sheet.id,
          label: day.label,
          focus: day.label,
        })
        .select()
        .single();

      if (dayRow && day.exercises) {
        const exercisesToInsert = day.exercises.map((ex: any, idx: number) => ({
          day_id: dayRow.id,
          name: ex.name,
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps?.toString() || "12",
          rest_seconds: (ex.rest_seconds || "60").toString(),
          order_index: idx,
        }));

        await supabase.from("exercises").insert(exercisesToInsert);
      }
    }

    return NextResponse.json({ success: true, sheetId: sheet.id });

  } catch (error: any) {
    console.error("OCR ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

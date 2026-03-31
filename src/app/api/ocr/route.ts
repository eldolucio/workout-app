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
    const prompt = `Analise esta ficha de treino e extraia todas as informações.
Identifique se cada item é musculação (exercício com séries/reps)
ou cardio (atividade com tempo/distância).
Retorne APENAS um JSON válido, sem markdown:
{
  "sheetName": "nome da ficha",
  "days": [
    {
      "label": "Treino A",
      "focus": "Peito e Tríceps",
      "exercises": [
        {
          "type": "strength",
          "name": "Supino Reto",
          "muscle_group": "Peito",
          "sets": 4,
          "reps": "12",
          "rest_seconds": "90"
        }
      ],
      "cardio": [
        {
          "type": "cardio",
          "cardio_type": "esteira",
          "label": "Cardio pós-treino",
          "duration_min": 20,
          "speed_kmh": 8.0,
          "incline_pct": 1.0,
          "notes": "Manter FC entre 130-150 bpm"
        },
        {
          "type": "cardio",
          "cardio_type": "hiit",
          "label": "HIIT tiros",
          "rounds": 8,
          "work_seconds": 30,
          "rest_seconds": 30,
          "effort_level": "maximo"
        }
      ]
    }
  ]
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
        name: workoutData.sheetName || name || "Ficha Importada",
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
          focus: day.focus || day.label,
        })
        .select()
        .single();

      if (dayRow && day.exercises && day.exercises.length > 0) {
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
      
      if (day.cardio && day.cardio.length > 0) {
        const cardiosToInsert = day.cardio.map((c: any, idx: number) => ({
          sheet_id: sheet.id,
          cardio_type: c.cardio_type || 'esteira',
          label: c.label || `Cardio ${idx+1}`,
          duration_min: c.duration_min || null,
          speed_kmh: c.speed_kmh || null,
          incline_pct: c.incline_pct || null,
          notes: c.notes || null,
          order_index: idx,
          work_seconds: c.work_seconds || null,
          rest_seconds: c.rest_seconds || null,
          rounds: c.rounds || null,
          effort_level: c.effort_level || null
        }));
        await supabase.from("cardio_sessions_prescribed").insert(cardiosToInsert);
      }
    }

    return NextResponse.json({ success: true, sheetId: sheet.id });

  } catch (error: any) {
    console.error("OCR ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

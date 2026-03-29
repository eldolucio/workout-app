export const dynamic = 'force-dynamic'
import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { bucketPath, userId, name } = await req.json();

    // 1. Gerar URL assinada (válida por 1 hora)
    const { data, error: signedError } = await supabase.storage
      .from("workout-sheets")
      .createSignedUrl(bucketPath, 3600);

    if (signedError || !data) throw signedError || new Error("Falha ao gerar URL assinada");

    const signedUrl = data.signedUrl;

    // 2. Call GPT-4o Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extraia desta ficha de treino: nome de cada exercício, séries, repetições e tempo de descanso.
              Retorne APENAS um JSON com a estrutura EXATA:
              { "days": [{ "label": "TREINO A", "exercises": [{ "name": "Supino Reto", "sets": 4, "reps": "12", "rest_seconds": "60" }] }] }`
            },
            {
              type: "image_url",
              image_url: { url: signedUrl }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const resultText = response.choices[0].message.content!;
    const workoutData = JSON.parse(resultText);

    // 3. Save to Supabase
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
        })
        .select()
        .single();

      if (dayRow && day.exercises) {
        const exercisesToInsert = day.exercises.map((ex: any, idx: number) => ({
          day_id: dayRow.id,
          name: ex.name,
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps.toString(),
          rest_seconds: (ex.rest_seconds || "60").toString(),
          order_index: idx
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

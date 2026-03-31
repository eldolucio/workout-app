import fs from 'fs';

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('ERRO: GEMINI_API_KEY not found in .env.local');
    return;
  }
  
  const imgPath = '/Users/eldolucio/Downloads/WhatsApp Image 2026-03-30 at 22.09.16.jpeg';
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Image = imgBuffer.toString('base64');
  
  const prompt = `Você é um especialista em leitura de fichas de treino de academia.
Analise esta imagem e extraia TODOS os exercícios presentes.
Agrupe por dia/treino (ex: "TREINO A", "TREINO B") se houver divisão.
Se não houver divisão, use "TREINO COMPLETO" como label.

Retorne APENAS um JSON válido com esta estrutura exata:
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

  console.log('Enviando imagem (base64) para o Gemini...');
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  const body = await geminiRes.text();
  console.log('Status HTTP:', geminiRes.status);
  try {
    const json = JSON.parse(body);
    console.log('Resposta JSON:', JSON.stringify(json, null, 2).substring(0, 1500));
  } catch (e) {
    console.log('Resposta Texto:', body.substring(0, 1500));
  }
}

await runTest();

export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Faltou a busca" }, { status: 400 });
  }

  try {
    const fetchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " exercicio musculacao execução correta")}`;
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      }
    });
    
    const html = await res.text();
    // Extrai o primeiro videoId encontrado no HTML serializado do YouTube
    const match = html.match(/"videoId":"([^"]{11})"/);
    
    if (match && match[1]) {
       return NextResponse.json({ videoId: match[1] });
    } else {
       return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });
    }
  } catch (err: any) {
    console.error("Youtube Search Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

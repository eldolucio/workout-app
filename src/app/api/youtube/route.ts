export const dynamic = 'force-dynamic'
import ytSearch from "yt-search";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Faltou a busca" }, { status: 400 });
  }

  try {
    const r = await ytSearch(q + " exercicio musculacao como fazer correto");
    const video = r.videos.find(v => v.seconds < 600); // Tentar pegar um video curto (menos de 10 min)
    
    if (video || r.videos[0]) {
       return NextResponse.json({ videoId: video?.videoId || r.videos[0].videoId });
    } else {
       return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });
    }
  } catch (err: any) {
    console.error("Youtube Search Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

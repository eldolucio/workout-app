import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verifica env vars primeiro
    if (!process.env.VAPID_EMAIL || !process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      return NextResponse.json({ error: 'Faltam chaves VAPID na Vercel.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseServiceKey) return NextResponse.json({ error: 'SERVICE_ROLE_KEY faltando.' }, { status: 500 })

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Tenta pegar o último dispositivo cadastrado no banco todo
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (subErr) return NextResponse.json({ error: 'Erro no banco: ' + subErr.message }, { status: 500 })
    if (!subs || subs.length === 0) {
      return NextResponse.json({ error: 'Nenhum dispositivo no banco! Por favor, recarregue a página de notificações no seu celular e ative de novo.' }, { status: 404 })
    }

    const sub = subs[0]

    // Configura VAPID
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const payload = JSON.stringify({
      title: 'WorkoutApp — Mega Teste',
      body: 'Se você leu isso, o sistema está 100% pronto! 💥',
      url: '/conquistas',
    })

    await webpush.sendNotification({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth_key }
    }, payload)

    return NextResponse.json({ success: true, message: 'Enviamos para o último aparelho que se cadastrou!', device: sub.device_name })
  } catch (err: any) {
    console.error('[Test Push] Erro crítico:', err)
    return NextResponse.json({ error: 'Erro crítico: ' + err.message }, { status: 500 })
  }
}

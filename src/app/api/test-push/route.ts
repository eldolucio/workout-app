import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Pega o usuário logado (pode ser o seu)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Se não estiver logado via cookies de server-side, vamos pegar a última sub cadastrada no banco 
    // apenas para este teste rápido (em produção usamos o ID do usuário)
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!subs || subs.length === 0) {
      return NextResponse.json({ error: 'Nenhum dispositivo encontrado no banco.' }, { status: 404 })
    }

    const sub = subs[0]

    // Configura VAPID
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth_key,
      },
    }

    const payload = JSON.stringify({
      title: 'WorkoutApp — Teste',
      body: 'Suas notificações estão funcionando perfeitamente! 💪',
      url: '/conquistas',
    })

    await webpush.sendNotification(pushSubscription, payload)

    return NextResponse.json({ success: true, message: 'Notificação enviada!' })
  } catch (err: any) {
    console.error('[Test Push] Erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

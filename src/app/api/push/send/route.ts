export const dynamic = 'force-dynamic'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  try {
    const { userId, title, body, url, tag, actions } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 })
    }

    // Busca todas as subscriptions do usuário (todos os dispositivos)
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subs?.length) {
      return NextResponse.json({ sent: 0, reason: 'Nenhum dispositivo encontrado' })
    }

    // Salva no log de notificações
    const { data: logEntry } = await supabaseAdmin
      .from('notification_log')
      .insert({ 
        user_id: userId, 
        type: tag ?? 'general', 
        title, 
        body 
      })
      .select().single()

    const payload = JSON.stringify({
      title, 
      body, 
      url: url ?? '/home',
      tag: tag ?? 'workout',
      notificationId: logEntry?.id,
      actions: actions ?? [],
    })

    // Envia para todos os dispositivos em paralelo
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        )
      )
    )

    // Remove subscriptions inválidas (rejeitadas pela rede de push)
    const failedEndpoints: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        failedEndpoints.push(subs[i].endpoint)
      }
    })

    if (failedEndpoints.length > 0) {
      await supabaseAdmin.from('push_subscriptions')
        .delete().in('endpoint', failedEndpoints)
    }

    const successfulCount = results.filter(r => r.status === 'fulfilled').length
    
    return NextResponse.json({ 
      sent: successfulCount, 
      total: subs.length,
      failed: failedEndpoints.length 
    })
  } catch (err: any) {
    console.error('[API/Push] Erro crítico ao enviar:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

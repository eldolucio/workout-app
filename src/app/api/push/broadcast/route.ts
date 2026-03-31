export const dynamic = 'force-dynamic'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  try {
    const { title, body, url, tag } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 })
    }

    // Busca todas as subscriptions de TODOS os usuários
    const { data: allSubs, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')

    if (subsError) throw subsError

    if (!allSubs?.length) {
      return NextResponse.json({ sent: 0, reason: 'Nenhuma assinatura encontrada no banco' })
    }

    const payload = JSON.stringify({
      title, 
      body, 
      url: url ?? '/home',
      tag: tag ?? 'app_update',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    })

    // Envia para todos os dispositivos em chunks para não estourar limites se houver muitos
    const results = await Promise.allSettled(
      allSubs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        )
      )
    )

    // Remove subscriptions inválidas 
    const failedEndpoints: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        failedEndpoints.push(allSubs[i].endpoint)
      }
    })

    if (failedEndpoints.length > 0) {
      await supabaseAdmin.from('push_subscriptions')
        .delete().in('endpoint', failedEndpoints)
    }

    const successfulCount = results.filter(r => r.status === 'fulfilled').length
    
    return NextResponse.json({ 
      success: true,
      sent: successfulCount, 
      total: allSubs.length,
      failed: failedEndpoints.length 
    })
  } catch (err: any) {
    console.error('[API/Push/Broadcast] Erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

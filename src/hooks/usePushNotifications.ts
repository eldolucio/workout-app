'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  registerServiceWorker, requestPushPermission,
  subscribeToPush, getDeviceName
} from '@/lib/push'

export function usePushNotifications() {
  const [permission, setPermission] = useState<string>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      
      // Verifica se já está inscrito no Service Worker
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

  const enable = async () => {
    setLoading(true)
    try {
      const reg = await registerServiceWorker()
      if (!reg) throw new Error('Service Worker não suportado')

      const perm = await requestPushPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const sub = await subscribeToPush(reg)
      if (!sub) throw new Error('Falha ao criar subscription')

      const subJson = sub.toJSON()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não logado')

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh!,
        auth_key: subJson.keys!.auth!,
        device_name: getDeviceName(),
      }, { onConflict: 'endpoint' })

      setSubscribed(true)
    } catch (err: any) {
      console.error('[Push] erro no enable:', err)
      alert(`Não foi possível ativar as notificações: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false)
    }
  }

  const disable = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await supabase.from('push_subscriptions')
          .delete().eq('endpoint', sub.endpoint)
      }
      setSubscribed(false)
    } catch (err) {
      console.error('[Push] erro no disable:', err)
    } finally {
      setLoading(false)
    }
  }

  return { permission, subscribed, loading, enable, disable }
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, BellOff, Smartphone, ShieldCheck, Trash2, Clock } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificacoesConfigPage() {
  const router = useRouter()
  const { permission, subscribed, loading, enable, disable } = usePushNotifications()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [reminderTime, setReminderTime] = useState("")
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")
      setUserId(user.id)

      const [subsRes, profRes] = await Promise.all([
        supabase.from('push_subscriptions').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('reminder_time').eq('id', user.id).single()
      ])

      if (subsRes.data) setSubscriptions(subsRes.data)
      if (profRes.data?.reminder_time) setReminderTime(profRes.data.reminder_time.substring(0, 5))
    }
    fetchData()
  }, [router])

  const handleSaveReminder = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ reminder_time: reminderTime }).eq('id', userId)
    setSaving(false)
    alert("Configurações salvas!")
  }

  const removeDevice = async (endpoint: string) => {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    setSubscriptions(prev => prev.filter(s => s.endpoint !== endpoint))
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <span style={styles.pageTitle}>NOTIFICAÇÕES</span>
        <div style={{ width: 60 }} />
      </header>

      <div style={styles.content}>
        <div style={styles.statusCard}>
          <div style={styles.statusHeader}>
            {permission === 'granted' ? (
              <div style={styles.statusBadgeActive}>
                <ShieldCheck size={14} /> ATIVO
              </div>
            ) : (
              <div style={styles.statusBadgeInactive}>
                <BellOff size={14} /> DESATIVADO
              </div>
            )}
            <h2 style={styles.sectionTitle}>STATUS DO DISPOSITIVO</h2>
          </div>
          
          <p style={styles.statusDesc}>
            {permission === 'denied' 
              ? "Você bloqueou as notificações. Reative nas configurações do navegador para receber alertas de treino."
              : "Receba alertas de conquistas, lembretes de treino e avisos de sequência em risco."}
          </p>

          <button 
            style={subscribed ? styles.btnDisable : styles.btnEnable}
            onClick={subscribed ? disable : enable}
            disabled={loading || permission === 'denied'}
          >
            {loading ? "Processando..." : subscribed ? "Desativar neste aparelho" : "Ativar notificações"}
          </button>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionHeader}>LEMBRETE DIÁRIO</h3>
          <div style={styles.configCard}>
            <div style={styles.row}>
              <div style={styles.iconBox}><Clock size={18} color="#c8f135" /></div>
              <div style={{ flex: 1 }}>
                <span style={styles.configLabel}>Horário do Lembrete</span>
                <p style={styles.configDesc}>Avisar se eu não treinar até este horário</p>
              </div>
              <input 
                type="time" 
                style={styles.timeInput} 
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
            <button style={styles.saveBtn} onClick={handleSaveReminder} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Horário"}
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionHeader}>APARELHOS CONECTADOS</h3>
          <div style={styles.deviceList}>
            {subscriptions.length > 0 ? subscriptions.map((sub, i) => (
              <div key={i} style={styles.deviceCard}>
                <Smartphone size={20} color="#555" />
                <div style={{ flex: 1 }}>
                  <span style={styles.deviceName}>{sub.device_name || "Dispositivo"}</span>
                  <span style={styles.deviceDate}>Registrado em {new Date(sub.created_at).toLocaleDateString()}</span>
                </div>
                <button style={styles.removeBtn} onClick={() => removeDevice(sub.endpoint)}>
                  <Trash2 size={16} />
                </button>
              </div>
            )) : (
              <div style={styles.emptyState}>Nenhum dispositivo cadastrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0a", maxWidth: "430px", margin: "auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px" },
  backBtn: { background: "none", border: "none", color: "#555", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", cursor: "pointer" },
  pageTitle: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: "16px" },
  content: { padding: "0 20px" },
  statusCard: { background: "#161616", border: "1px solid #222", borderRadius: "20px", padding: "24px", marginBottom: "30px" },
  statusHeader: { display: "flex", flexDirection: "column" as const, gap: "12px", marginBottom: "16px" },
  statusBadgeActive: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#1a2a00", color: "#c8f135", fontSize: "11px", fontWeight: 800, padding: "4px 10px", borderRadius: "20px", alignSelf: "flex-start" },
  statusBadgeInactive: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#2a0000", color: "#E24B4A", fontSize: "11px", fontWeight: 800, padding: "4px 10px", borderRadius: "20px", alignSelf: "flex-start" },
  sectionTitle: { color: "#f0f0f0", fontFamily: "Barlow Condensed, sans-serif", fontSize: "20px", fontWeight: 800, margin: 0 },
  statusDesc: { color: "#888", fontSize: "13px", lineHeight: "1.5", marginBottom: "20px" },
  btnEnable: { width: "100%", background: "#c8f135", color: "#0a0a0a", border: "none", padding: "14px", borderRadius: "12px", fontWeight: 700, fontFamily: "Barlow Condensed, sans-serif", fontSize: "15px", cursor: "pointer" },
  btnDisable: { width: "100%", background: "transparent", color: "#555", border: "1px solid #222", padding: "14px", borderRadius: "12px", fontWeight: 700, fontFamily: "Barlow Condensed, sans-serif", fontSize: "15px", cursor: "pointer" },
  section: { marginBottom: "30px" },
  sectionHeader: { color: "#555", fontFamily: "Barlow Condensed, sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: ".1em", marginBottom: "12px" },
  configCard: { background: "#161616", border: "1px solid #222", borderRadius: "16px", padding: "16px" },
  row: { display: "flex", gap: "14px", alignItems: "center", marginBottom: "16px" },
  iconBox: { width: "40px", height: "40px", background: "#0a0a0a", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
  configLabel: { display: "block", color: "#f0f0f0", fontWeight: 600, fontSize: "14px" },
  configDesc: { color: "#555", fontSize: "11px", margin: 0 },
  timeInput: { background: "#0a0a0a", border: "1px solid #222", color: "#f0f0f0", padding: "8px", borderRadius: "8px", fontSize: "14px", outline: "none" },
  saveBtn: { width: "100%", background: "#1e1e1e", color: "#ccc", border: "none", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" },
  deviceList: { display: "flex", flexDirection: "column" as const, gap: "10px" },
  deviceCard: { background: "#161616", border: "1px solid #222", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "14px" },
  deviceName: { display: "block", color: "#f0f0f0", fontSize: "13px", fontWeight: 600 },
  deviceDate: { display: "block", color: "#444", fontSize: "11px" },
  removeBtn: { background: "none", border: "none", color: "#444", padding: "8px", cursor: "pointer" },
  emptyState: { textAlign: "center" as const, color: "#444", fontSize: "13px", padding: "20px" }
}

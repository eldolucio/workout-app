"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CardioSessionDone, CardioSessionPrescribed } from "@/types/cardio"

const styles = {
  container: {
    padding: "2rem 1.5rem",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#f0f0f0",
    cursor: "pointer",
    padding: "8px",
  },
  title: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.5rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#c8f135",
    letterSpacing: "0.05em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  card: {
    background: "#161616",
    borderRadius: "14px",
    border: "1px solid #222",
    padding: "20px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    cursor: "pointer",
    position: "relative" as const,
  },
  cardTitle: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.125rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#f0f0f0",
  },
  cardDesc: {
    fontFamily: "Barlow",
    fontSize: "0.75rem",
    color: "#555",
    textAlign: "center" as const,
  },
  badge: {
    position: "absolute" as const,
    top: "-8px",
    right: "-8px",
    background: "#c8f135",
    color: "#0a0a0a",
    fontFamily: "Barlow Condensed",
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: "8px",
    textTransform: "uppercase" as const,
  },
  historySection: {
    marginTop: "1rem",
  },
  historyTitle: {
    fontFamily: "Barlow Condensed",
    color: "#c8f135",
    textTransform: "uppercase" as const,
    fontSize: "1.25rem",
    marginBottom: "1rem",
  },
  historyCard: {
    background: "#161616",
    padding: "1rem",
    borderRadius: "12px",
    marginBottom: "8px",
    border: "1px solid #222",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
}

export default function CardioSelectionPage() {
  const router = useRouter()
  const [prescribed, setPrescribed] = useState<CardioSessionPrescribed[]>([])
  const [history, setHistory] = useState<CardioSessionDone[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Busca cardio prescrito ativo (associado à ficha ativa do usuário)
    const { data: activeSheet } = await supabase
      .from('training_sheets')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (activeSheet) {
      const { data: presc } = await supabase
        .from('cardio_sessions_prescribed')
        .select('*')
        .eq('sheet_id', activeSheet.id)
      if (presc) setPrescribed(presc)
    }

    // Busca histórico rápido
    const { data: hist } = await supabase
      .from('cardio_sessions_done')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5)
    
    if (hist) setHistory(hist)
  }

  const navigateToCardio = (type: string, prescribedId?: string) => {
    const query = prescribedId ? `?prescribed=${prescribedId}` : ""
    router.push(`/cardio/${type}${query}`)
  }

  // Ícones SVGs inline simplificados
  const icons = {
    esteira: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
        <path d="M15 15.5 12 13V9l-3 3"/>
        <path d="M17 9h-3V6.5"/>
        <path d="M12 13 9 17l-3 2"/>
        <path d="M22 22H2"/>
      </svg>
    ),
    bike: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5"/>
        <circle cx="18.5" cy="17.5" r="3.5"/>
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 11.5V14l-3-3 4-3 2 3h2"/>
      </svg>
    ),
    eliptico: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="10" ry="5"/>
        <path d="M12 7v10M7 10h10"/>
      </svg>
    ),
    hiit: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    )
  }

  const CARDIO_TYPES = [
    { type: 'esteira', name: 'ESTEIRA', desc: 'Velocidade e inclinação' },
    { type: 'bike', name: 'BIKE', desc: 'Ciclismo indoor ou rua' },
    { type: 'eliptico', name: 'ELÍPTICO', desc: 'Resistência e RPM' },
    { type: 'hiit', name: 'HIIT', desc: 'Treino em intervalos' },
  ]

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backButton} onClick={() => router.push("/home")}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={styles.title}>CARDIO</h1>
      </header>

      <div>
        <h2 style={{ ...styles.cardTitle, color: "#c8f135", marginBottom: "12px" }}>ESCOLHA O TIPO</h2>
        <div style={styles.grid}>
          {CARDIO_TYPES.map(t => {
            const hasPrescribed = prescribed.find(p => p.cardio_type === t.type)
            return (
              <div key={t.type} style={styles.card} onClick={() => navigateToCardio(t.type, hasPrescribed?.id)}>
                {hasPrescribed && <span style={styles.badge}>Prescrito</span>}
                {icons[t.type as keyof typeof icons]}
                <span style={styles.cardTitle}>{t.name}</span>
                <span style={styles.cardDesc}>{t.desc}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={styles.historySection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <h2 style={{...styles.historyTitle, marginBottom: 0}}>ÚLTIMAS SESSÕES</h2>
          <span style={{color: '#c8f135', fontSize: '0.875rem', fontFamily: 'Barlow Condensed', cursor: 'pointer'}} onClick={() => router.push('/cardio/historico')}>VER TUDO</span>
        </div>
        
        {history.length === 0 ? (
          <p style={{ color: "#555", fontSize: "0.875rem" }}>Nenhuma sessão recente registrada.</p>
        ) : (
          history.map(session => (
            <div key={session.id} style={styles.historyCard} onClick={() => router.push(`/cardio/sessao/${session.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#222', borderRadius: '50%', padding: '8px' }}>
                  <Clock size={16} color="#c8f135" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#f0f0f0', fontFamily: 'Barlow Condensed', fontSize: '1.125rem', textTransform: 'uppercase' }}>
                    {session.label || session.cardio_type}
                  </span>
                  <span style={{ color: '#555', fontSize: '0.75rem' }}>
                    {new Date(session.started_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ color: '#c8f135', fontFamily: 'Barlow Condensed', fontSize: '1rem' }}>
                  {Math.floor((session.duration_sec || 0) / 60)} min
                </span>
                <span style={{ color: '#888', fontSize: '0.75rem' }}>
                  {session.distance_km ? `${session.distance_km} km` : session.calories ? `${session.calories} kcal` : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

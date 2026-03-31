"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CardioSessionDone, CardioType } from "@/types/cardio"

const styles = {
  container: {
    padding: "2rem 1.5rem",
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
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
  filters: {
    display: "flex",
    gap: "8px",
    overflowX: "auto" as const,
    paddingBottom: "8px",
  },
  pill: (active: boolean) => ({
    padding: "6px 16px",
    borderRadius: "20px",
    background: active ? "#c8f135" : "#161616",
    color: active ? "#000" : "#888",
    fontFamily: "Barlow Condensed",
    fontWeight: 700,
    fontSize: "0.875rem",
    border: `1px solid ${active ? "#c8f135" : "#333"}`,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  }),
  card: {
    background: "#161616",
    borderRadius: "14px",
    border: "1px solid #222",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    cursor: "pointer",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "#f0f0f0",
    textTransform: "uppercase" as const,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  cardDate: {
    fontSize: "0.75rem",
    color: "#888",
  },
  cardStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "8px",
  },
  statVal: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#c8f135",
  },
  statLabel: {
    fontFamily: "Barlow",
    fontSize: "0.75rem",
    color: "#555",
    textTransform: "uppercase" as const,
  },
  zoneBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontFamily: "Barlow Condensed",
    fontSize: "0.75rem",
    color: "#000",
    background: "#c8f135", // Dinamico
    marginTop: "8px",
  }
}

export default function CardioHistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<CardioSessionDone[]>([])
  const [filter, setFilter] = useState<CardioType | 'tudo'>('tudo')

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      let q = supabase.from('cardio_sessions_done').select('*').eq('user_id', user.id).order('started_at', { ascending: false })
      if (filter !== 'tudo') q = q.eq('cardio_type', filter)
      
      const { data } = await q
      if (data) setSessions(data)
    }
    fetchHistory()
  }, [filter])

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backButton} onClick={() => router.push("/cardio")}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={styles.title}>HISTÓRICO DE CARDIO</h1>
      </header>

      <div style={styles.filters}>
        {(['tudo', 'esteira', 'bike', 'eliptico', 'hiit'] as const).map(f => (
          <div key={f} style={styles.pill(filter === f)} onClick={() => setFilter(f)}>
            {f.toUpperCase()}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sessions.map(s => {
          const duration = Math.floor((s.duration_sec || 0) / 60)
          return (
            <div key={s.id} style={styles.card} onClick={() => router.push(`/cardio/sessao/${s.id}`)}>
              <div style={styles.cardTop}>
                <span style={styles.cardTitle}>{s.label || s.cardio_type}</span>
                <span style={styles.cardDate}>{new Date(s.started_at).toLocaleDateString()}</span>
              </div>
              <div style={styles.cardStats}>
                <div>
                  <span style={styles.statVal}>{duration}<span style={{fontSize:"1rem"}}>{s.duration_sec! % 60}s</span></span>
                  <div style={styles.statLabel}>TEMPO TOTAL</div>
                </div>
                {s.distance_km && (
                  <div>
                    <span style={{...styles.statVal, color: "#f0f0f0"}}>{s.distance_km.toFixed(2)} km</span>
                    <div style={styles.statLabel}>DISTÂNCIA</div>
                  </div>
                )}
                {s.total_strides && (
                  <div>
                    <span style={{...styles.statVal, color: "#f0f0f0"}}>{s.total_strides}</span>
                    <div style={styles.statLabel}>PASSADAS</div>
                  </div>
                )}
                {s.calories && (
                  <div>
                    <span style={{...styles.statVal, color: "#EF9F27"}}>{s.calories} kcal</span>
                    <div style={styles.statLabel}>CALORIAS</div>
                  </div>
                )}
                {s.heart_zone && (
                   <div style={{ gridColumn: "span 2" }}>
                     <span style={styles.zoneBadge}>{s.heart_zone} — {s.avg_heart_rate} bpm (Média)</span>
                   </div>
                )}
              </div>
            </div>
          )
        })}
        {sessions.length === 0 && (
          <p style={{ color: "#555", fontSize: "0.875rem", textAlign: "center", marginTop: "2rem" }}>
             Nenhum histórico encontrado para este filtro.
          </p>
        )}
      </div>
    </div>
  )
}

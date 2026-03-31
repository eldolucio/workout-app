"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, FileText, Heart, Repeat } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CardioSessionDone } from "@/types/cardio"

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
  title: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.25rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    color: "#f0f0f0",
  },
  subtitle: {
    color: "#888",
    fontSize: "0.875rem",
  },
  block: {
    background: "#161616",
    borderRadius: "14px",
    border: "1px solid #222",
    padding: "20px",
  },
  metricTitle: {
    fontFamily: "Barlow Condensed",
    color: "#c8f135",
    textTransform: "uppercase" as const,
    fontSize: "1rem",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  val: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#f0f0f0",
  },
  label: {
    fontFamily: "Barlow",
    fontSize: "0.75rem",
    color: "#555",
    textTransform: "uppercase" as const,
  },
  btn: {
    background: "#c8f135",
    color: "#0a0a0a",
    border: "none",
    padding: "16px",
    borderRadius: "12px",
    fontFamily: "Barlow Condensed",
    fontWeight: "bold",
    fontSize: "1.125rem",
    marginTop: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
  }
}

export default function CardioSessionDetail() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  
  const [session, setSession] = useState<CardioSessionDone | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('cardio_sessions_done').select('*').eq('id', id).single()
      if (data) setSession(data)
    }
    load()
  }, [id])

  if (!session) return <div style={styles.container}>Carregando...</div>

  const durationMin = Math.floor((session.duration_sec || 0) / 60)
  const durationSec = (session.duration_sec || 0) % 60

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => router.back()} style={{background:"none", border:"none", color:"#f0f0f0"}}><ArrowLeft size={24} /></button>
        <div>
          <h1 style={styles.title}>{session.label || session.cardio_type}</h1>
          <span style={styles.subtitle}>{new Date(session.started_at).toLocaleString()}</span>
        </div>
      </header>

      <div style={styles.block}>
        <h2 style={styles.metricTitle}><Clock size={16}/> Resumo</h2>
        <div style={styles.grid}>
          <div>
             <span style={styles.val}>{durationMin}<span style={{fontSize:"1rem"}}>{durationSec}s</span></span>
             <div style={styles.label}>TEMPO TOTAL</div>
          </div>
          <div>
             <span style={{...styles.val, color:"#EF9F27"}}>{session.calories || '--'} kcal</span>
             <div style={styles.label}>CALORIAS</div>
          </div>
          {session.distance_km && (
            <div>
               <span style={styles.val}>{session.distance_km.toFixed(2)} km</span>
               <div style={styles.label}>DISTÂNCIA</div>
            </div>
          )}
          {session.avg_speed_kmh && (
            <div>
               <span style={styles.val}>{session.avg_speed_kmh.toFixed(1)} km/h</span>
               <div style={styles.label}>VELOCIDADE MÉDIA</div>
            </div>
          )}
          {session.total_strides && (
            <div>
               <span style={styles.val}>{session.total_strides}</span>
               <div style={styles.label}>PASSADAS TOTAIS</div>
            </div>
          )}
        </div>
      </div>

      {(session.avg_heart_rate || session.max_heart_rate) && (
        <div style={styles.block}>
          <h2 style={styles.metricTitle}><Heart size={16} color="#E24B4A"/> Frequência Cardíaca</h2>
          <div style={styles.grid}>
            <div>
               <span style={styles.val}>{session.avg_heart_rate} bpm</span>
               <div style={styles.label}>FC MÉDIA</div>
            </div>
            <div>
               <span style={{...styles.val, color:"#E24B4A"}}>{session.max_heart_rate || '--'} bpm</span>
               <div style={styles.label}>FC MÁXIMA</div>
            </div>
            {session.heart_zone && (
               <div style={{ gridColumn: "span 2" }}>
                 <div style={styles.label}>ZONA PREDOMINANTE</div>
                 <span style={{...styles.val, fontSize: "1.25rem", color: "#c8f135"}}>{session.heart_zone}</span>
               </div>
            )}
          </div>
        </div>
      )}

      {session.notes && (
        <div style={styles.block}>
          <h2 style={styles.metricTitle}><FileText size={16}/> Notas</h2>
          <p style={{ fontFamily: "Barlow", color: "#ccc", fontSize: "0.875rem", lineHeight: "1.5" }}>
            {session.notes}
          </p>
        </div>
      )}

      <button style={styles.btn} onClick={() => router.push(`/cardio/${session.cardio_type}`)}>
         <Repeat size={20} /> REPETIR ESTE TREINO
      </button>

    </div>
  )
}

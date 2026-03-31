"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { estimateCalories, getHeartZone } from "@/lib/cardio"

export default function CardioFinishModal({
  tipo,
  prescribed,
  seconds,
  distance,
  speed,
  incline,
  rpm,
  resistance,
  spm,
  totalStrides,
  hrHistory,
  currentNotes,
  onClose
}: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [effort, setEffort] = useState(5)
  const [notes, setNotes] = useState(currentNotes || "")

  const durationMin = seconds / 60
  
  // Stats
  const avgHr = hrHistory.length > 0 ? Math.round(hrHistory.reduce((a:number,b:number)=>a+b,0)/hrHistory.length) : null
  const maxHr = hrHistory.length > 0 ? Math.max(...hrHistory) : null
  
  const estimatedCals = estimateCalories(durationMin, tipo, 75, effort / 5)

  let effortLabel = "Moderado"
  let effortColor = "#1D9E75" // verde
  if (effort <= 3) { effortLabel = "Leve"; effortColor = "#3B8BD4" }
  else if (effort <= 6) { effortLabel = "Moderado"; effortColor = "#1D9E75" }
  else if (effort <= 8) { effortLabel = "Intenso"; effortColor = "#EF9F27" }
  else { effortLabel = "Máximo"; effortColor = "#E24B4A" }

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Insert session done
    const { data: sessionData, error } = await supabase.from('cardio_sessions_done').insert({
      user_id: user.id,
      prescribed_id: prescribed ? prescribed.id : null,
      cardio_type: tipo,
      label: prescribed ? prescribed.label : `Sessão Livre de ${tipo.toUpperCase()}`,
      duration_sec: seconds,
      calories: estimatedCals,
      avg_heart_rate: avgHr,
      max_heart_rate: maxHr,
      heart_zone: avgHr ? getHeartZone(avgHr, 190).name : null, // simplificado sem idade exata
      notes: notes,
      distance_km: tipo === 'esteira' || tipo === 'bike' ? distance : null,
      avg_speed_kmh: tipo === 'esteira' ? speed : null,
      max_speed_kmh: tipo === 'esteira' ? speed : null, // Pode ter um tracking de max
      incline_pct: tipo === 'esteira' ? incline : null,
      avg_rpm: tipo === 'bike' ? rpm : null,
      resistance_used: resistance,
      total_strides: totalStrides,
      avg_spm: tipo === 'eliptico' ? spm : null,
    }).select().single()

    if (error) {
       console.error("Erro salvando cardio:", error)
       alert("Ocorreu um erro ao salvar o cardio.")
       setLoading(false)
       return
    }

    // 2. Call Gamification
    try {
      await fetch('/api/gamification/cardio-complete', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            userId: user.id,
            durationMin: durationMin,
            sessionId: sessionData.id,
            cardioType: tipo,
            avgHr: avgHr
         })
      })
    } catch(e) { console.error("Erro gamificação", e) }

    router.replace('/home')
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
      <div style={{ background: "#161616", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "20px", maxHeight: "90vh", overflowY: "auto" }}>
        
        <div style={{ textAlign: "center" }}>
           <h2 style={{ fontFamily: "Barlow Condensed", fontSize: "1.5rem", color: "#f0f0f0", margin: 0 }}>CARDIO CONCLUÍDO!</h2>
           <span style={{ color: "#c8f135", fontSize: "1.25rem", fontFamily: "Barlow Condensed" }}>{Math.floor(durationMin)} min {(seconds % 60).toString().padStart(2, '0')}s</span>
        </div>

        <div style={{ background: "#222", padding: "16px", borderRadius: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
           {['esteira', 'bike'].includes(tipo) && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                 <span style={{ color: "#555", fontSize: "0.75rem", textTransform: "uppercase" }}>Distância</span>
                 <span style={{ color: "#f0f0f0", fontSize: "1.25rem", fontFamily: "Barlow Condensed" }}>{distance.toFixed(2)} km</span>
              </div>
           )}
           <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#555", fontSize: "0.75rem", textTransform: "uppercase" }}>Calorias</span>
              <span style={{ color: "#EF9F27", fontSize: "1.25rem", fontFamily: "Barlow Condensed" }}>{estimatedCals} kcal</span>
           </div>
           
           {avgHr && (
             <div style={{ display: "flex", flexDirection: "column", gridColumn: "span 2" }}>
                 <span style={{ color: "#555", fontSize: "0.75rem", textTransform: "uppercase" }}>FC Média</span>
                 <span style={{ color: getHeartZone(avgHr, 190).color, fontSize: "1.25rem", fontFamily: "Barlow Condensed" }}>{avgHr} bpm — {getHeartZone(avgHr, 190).name}</span>
              </div>
           )}
        </div>

        {/* Carga Interna (RPE) */}
        <div>
           <span style={{ color: "#f0f0f0", fontFamily: "Barlow Condensed", display: "block", marginBottom: "8px" }}>NÍVEL DE ESFORÇO: <span style={{ color: effortColor }}>{effortLabel}</span></span>
           <input type="range" min="1" max="10" value={effort} onChange={(e) => setEffort(parseInt(e.target.value))} style={{ width: "100%", accentColor: effortColor }} />
        </div>

        {/* Notas */}
        <div>
           <textarea 
             placeholder="Como foi o treino?" 
             value={notes} 
             onChange={e => setNotes(e.target.value)}
             style={{ width: "100%", background: "#000", border: "1px solid #333", color: "#f0f0f0", padding: "12px", borderRadius: "8px", minHeight: "80px", fontFamily: "Barlow", resize: "none" }}
           />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
           <button onClick={handleSave} disabled={loading} style={{ background: "#c8f135", color: "#000", border: "none", padding: "16px", borderRadius: "12px", fontFamily: "Barlow Condensed", fontSize: "1.125rem", fontWeight: "bold", opacity: loading ? 0.5 : 1 }}>
             {loading ? "SALVANDO..." : "SALVAR SESSÃO"}
           </button>
           <button onClick={onClose} disabled={loading} style={{ background: "transparent", color: "#888", border: "none", padding: "12px", borderRadius: "12px", fontFamily: "Barlow Condensed", fontSize: "1rem" }}>
             VOLTAR PARA O TREINO
           </button>
        </div>

      </div>
    </div>
  )
}

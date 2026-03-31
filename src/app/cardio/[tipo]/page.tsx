"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { X, Play, Pause, RotateCcw, Flag, Heart, Bluetooth, Edit2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CardioType, CardioSessionPrescribed, HEART_ZONES } from "@/types/cardio"
import { maxHeartRate, getHeartZone, formatTime, formatPace, speedToPace } from "@/lib/cardio"
import { connectHeartRateMonitor, disconnectDevice } from "@/lib/bluetooth"
import CardioFinishModal from "./CardioFinishModal"
import HiitExecution from "./HiitExecution"

const styles = {
  container: {
    padding: "1rem",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    background: "#0a0a0a",
  },
  header: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "#f0f0f0",
    textTransform: "uppercase" as const,
  },
  circleContainer: {
    position: "relative" as const,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "240px",
    height: "240px",
    marginTop: "2rem",
  },
  svgCircle: {
    transform: "rotate(-90deg)",
    width: "100%",
    height: "100%",
  },
  timerText: {
    position: "absolute" as const,
    fontFamily: "Barlow Condensed",
    fontSize: "4rem",
    fontWeight: 800,
    color: "#f0f0f0",
  },
  timerSubtext: {
    position: "absolute" as const,
    bottom: "40px",
    fontFamily: "Barlow Condensed",
    color: "#c8f135",
    fontSize: "1rem",
    textTransform: "uppercase" as const,
  },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    marginTop: "2rem",
  },
  playBtn: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#c8f135",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  secBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#161616",
    border: "1px solid #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    width: "100%",
    marginTop: "2rem",
  },
  metricCard: {
    background: "#161616",
    border: "1px solid #222",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    cursor: "pointer",
  },
  metricVal: {
    fontFamily: "Barlow Condensed",
    fontSize: "2rem",
    fontWeight: 800,
    color: "#f0f0f0",
  },
  metricLabel: {
    fontFamily: "Barlow",
    fontSize: "0.75rem",
    color: "#555",
    textTransform: "uppercase" as const,
  },
  hrSection: {
    width: "100%",
    background: "#161616",
    border: "1px solid #222",
    borderRadius: "12px",
    padding: "16px",
    marginTop: "16px",
  },
  hrBar: {
    display: "flex",
    height: "8px",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "8px",
  },
  notesBtn: {
    position: "fixed" as const,
    bottom: "20px",
    right: "20px",
    background: "#333",
    border: "none",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  }
}

// Subcomponent para entrada manual rápida
function ValueEditor({ label, value, onSave, onCancel }: any) {
  const [val, setVal] = useState(String(value))
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#161616", padding: "24px", borderRadius: "16px", width: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ color: "#f0f0f0", fontFamily: "Barlow Condensed" }}>{label}</h3>
        <input 
          type="number" step="0.5" 
          value={val} 
          onChange={e => setVal(e.target.value)}
          autoFocus
          style={{ background: "#000", border: "1px solid #333", color: "#c8f135", padding: "12px", borderRadius: "8px", fontSize: "1.5rem", textAlign: "center", fontFamily: "Barlow Condensed" }}
        />
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid #333", color: "#fff", borderRadius: "8px" }}>Cancelar</button>
          <button onClick={() => onSave(Number(val))} style={{ flex: 1, padding: "12px", background: "#c8f135", border: "none", color: "#000", borderRadius: "8px", fontWeight: "bold" }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

export default function CardioExecutionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tipo = params.tipo as CardioType
  const prescribedId = searchParams.get('prescribed')

  const [paused, setPaused] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [prescribed, setPrescribed] = useState<CardioSessionPrescribed | null>(null)
  const [userAge, setUserAge] = useState(30)
  
  // Variáveis ativas
  const [speed, setSpeed] = useState(6.0)
  const [incline, setIncline] = useState(0.0)
  const [rpm, setRpm] = useState(80)
  const [resistance, setResistance] = useState(5)
  const [spm, setSpm] = useState(120)

  // Tracking FC
  const [hrConnected, setHrConnected] = useState(false)
  const [currentHr, setCurrentHr] = useState(0)
  const [hrHistory, setHrHistory] = useState<number[]>([])
  
  // Editor
  const [editing, setEditing] = useState<{key: string, label: string, val: number} | null>(null)
  
  // Modais e Conclusão
  const [notes] = useState("")
  // const [showNotes, setShowNotes] = useState(false)
  const [finished, setFinished] = useState(false)

  // Dispositivo BT
  const btDevice = useRef<BluetoothDevice | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase.from('profiles').select('birth_year').eq('id', user.id).single()
      if (profile && profile.birth_year) setUserAge(new Date().getFullYear() - profile.birth_year)
      
      if (prescribedId) {
        const { data } = await supabase.from('cardio_sessions_prescribed').select('*').eq('id', prescribedId).single()
        if (data) {
          setPrescribed(data)
          if (data.speed_kmh) setSpeed(data.speed_kmh)
          if (data.incline_pct) setIncline(data.incline_pct)
          if (data.rpm_target) setRpm(data.rpm_target)
          if (data.spm_target) setSpm(data.spm_target)
          if (data.resistance) setResistance(data.resistance)
        }
      }
    }
    load()
    
    return () => {
      // Limpar bt na desmontagem
      if (btDevice.current) disconnectDevice(btDevice.current)
    }
  }, [prescribedId])

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setSeconds(s => s + 1)
      if (currentHr > 0) {
         setHrHistory(prev => [...prev, currentHr])
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [paused, currentHr])

  // Cálculos dinâmicos baseados no tempo real
  const durationMin = seconds / 60
  let distance = 0
  if (tipo === 'esteira') distance = speed * (durationMin / 60)
  if (tipo === 'bike') distance = (rpm * 60 * (durationMin / 60) * 2.1) / 1000 // Aprox. circunferencia
  
  const pace = tipo === 'esteira' ? speedToPace(speed) : 0
  const totalStrides = tipo === 'eliptico' ? Math.round(spm * durationMin) : 0

  const maxHrCurrent = maxHeartRate(new Date().getFullYear() - userAge)
  const zone = getHeartZone(currentHr, maxHrCurrent)

  const handleConnectBT = async () => {
    const device = await connectHeartRateMonitor((bpm) => {
      setCurrentHr(bpm)
    }, () => {
      setHrConnected(false)
      setCurrentHr(0)
    })
    
    if (device) {
      btDevice.current = device
      setHrConnected(true)
    }
  }

  // --- Renderização visual da barra circulare
  const totalPrescribed = (prescribed?.duration_min || 30) * 60
  const progressPct = Math.min((seconds / totalPrescribed) * 100, 100)
  const dashArray = 200 * Math.PI // 2 * PI * r (r=100)
  const dashOffset = dashArray - (dashArray * progressPct) / 100

  // Se for HIIT, renderiza o componente específico
  if (tipo === 'hiit') {
    return <HiitExecution prescribedId={prescribedId} />
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => { if(confirm("Descartar sessão?")) router.back() }} style={{background:"none", border:"none", color:"#555"}}><X size={28} /></button>
        <span style={styles.title}>{tipo}</span>
        <div style={{width: 28}}></div>
      </header>

      {/* Timer Circular */}
      <div style={styles.circleContainer}>
        <svg style={styles.svgCircle} viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="100" fill="none" stroke="#222" strokeWidth="8" />
          <circle 
            cx="110" cy="110" r="100" 
            fill="none" stroke="#c8f135" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{...styles.timerText, opacity: paused && seconds > 0 ? 0.5 : 1}}>
          {formatTime(seconds)}
        </div>
        <div style={styles.timerSubtext}>{paused ? (seconds === 0 ? "Pronto" : "Pausado") : "Rodando"}</div>
      </div>

      {/* Controles */}
      <div style={styles.controlsRow}>
        <button style={styles.secBtn} onClick={() => { setSeconds(0); setPaused(true); setHrHistory([]) }}>
           <RotateCcw size={20} color="#f0f0f0" />
        </button>
        <button style={styles.playBtn} onClick={() => setPaused(!paused)}>
           {paused ? <Play size={28} color="#000" fill="#000" /> : <Pause size={28} color="#000" fill="#000" />}
        </button>
        <button style={styles.secBtn} onClick={() => setFinished(true)}>
           <Flag size={20} color="#c8f135" />
        </button>
      </div>

      {/* Métricas Dinâmicas por Tipo */}
      <div style={styles.metricsGrid}>
        {tipo === 'esteira' && (
          <>
            <div style={styles.metricCard} onClick={() => setEditing({key: 'speed', label: 'Velocidade (km/h)', val: speed})}>
              <span style={styles.metricVal}>{speed.toFixed(1)}</span>
              <span style={styles.metricLabel}>KM/H <Edit2 size={10}/></span>
            </div>
            <div style={styles.metricCard} onClick={() => setEditing({key: 'incline', label: 'Inclinação (%)', val: incline})}>
              <span style={styles.metricVal}>{incline.toFixed(1)}</span>
              <span style={styles.metricLabel}>Inclinação <Edit2 size={10}/></span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricVal}>{distance.toFixed(2)}</span>
              <span style={styles.metricLabel}>Distância (km)</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricVal}>{formatPace(pace).split(' ')[0]}</span>
              <span style={styles.metricLabel}>Pace (/km)</span>
            </div>
          </>
        )}
        {tipo === 'bike' && (
          <>
            <div style={styles.metricCard} onClick={() => setEditing({key: 'rpm', label: 'RPM', val: rpm})}>
              <span style={styles.metricVal}>{rpm}</span>
              <span style={styles.metricLabel}>RPM <Edit2 size={10}/></span>
            </div>
            <div style={styles.metricCard} onClick={() => setEditing({key: 'resistance', label: 'Resistência (1-20)', val: resistance})}>
              <span style={styles.metricVal}>{resistance}</span>
              <span style={styles.metricLabel}>Carga <Edit2 size={10}/></span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricVal}>{distance.toFixed(2)}</span>
              <span style={styles.metricLabel}>Distância (km)</span>
            </div>
          </>
        )}
        {tipo === 'eliptico' && (
          <>
            <div style={styles.metricCard} onClick={() => setEditing({key: 'spm', label: 'SPM (Passos/min)', val: spm})}>
              <span style={styles.metricVal}>{spm}</span>
              <span style={styles.metricLabel}>SPM <Edit2 size={10}/></span>
            </div>
            <div style={styles.metricCard} onClick={() => setEditing({key: 'resistance', label: 'Resistência (1-20)', val: resistance})}>
              <span style={styles.metricVal}>{resistance}</span>
              <span style={styles.metricLabel}>Carga <Edit2 size={10}/></span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricVal}>{totalStrides}</span>
              <span style={styles.metricLabel}>Passos</span>
            </div>
          </>
        )}
      </div>

      {/* Editor Modal Embutido */}
      {editing && (
        <ValueEditor 
          label={editing.label} 
          value={editing.val} 
          onCancel={() => setEditing(null)} 
          onSave={(v: number) => {
            if (editing.key === 'speed') setSpeed(v);
            if (editing.key === 'incline') setIncline(v);
            if (editing.key === 'rpm') setRpm(v);
            if (editing.key === 'spm') setSpm(v);
            if (editing.key === 'resistance') setResistance(v);
            setEditing(null);
          }} 
        />
      )}

      {/* FC Section */}
      <div style={styles.hrSection}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{fontFamily: "Barlow Condensed", color: "#f0f0f0", display: "flex", alignItems: "center", gap: "8px"}}>
            <Heart size={16} color={zone.color} fill={currentHr > 0 ? zone.color : "transparent"} /> 
            FREQUÊNCIA CARDÍACA
          </span>
          {!hrConnected ? (
             <button onClick={handleConnectBT} style={{background: "transparent", border:"1px solid #333", color: "#888", borderRadius: "16px", padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px"}}>
                <Bluetooth size={12}/> Sincronizar
             </button>
          ) : (
             <span style={{color: "#1D9E75", fontSize: "0.75rem"}}>Conectado</span>
          )}
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "16px" }}>
           <div onClick={() => setEditing({key: 'hr', label: 'Insira FC Manualmente', val: currentHr})} style={{ cursor: "pointer" }}>
             <span style={{ fontSize: "2.5rem", fontFamily: "Barlow Condensed", fontWeight: 800, color: currentHr > 0 ? zone.color : "#555" }}>
                {currentHr > 0 ? currentHr : "--"}
             </span>
             <span style={{ fontSize: "0.875rem", color: "#555", marginLeft: "4px" }}>bpm</span>
           </div>
           
           <div style={{ textAlign: "right" }}>
             <span style={{ display: "block", color: currentHr > 0 ? zone.color : "#555", fontFamily: "Barlow Condensed", fontSize: "1rem" }}>
                {currentHr > 0 ? zone.name : "Aguardando leitura"}
             </span>
             <span style={{ fontSize: "0.75rem", color: "#888" }}>Max: {maxHrCurrent} bpm</span>
           </div>
        </div>

        {/* Zonas Bar */}
        <div style={styles.hrBar}>
          {HEART_ZONES.map((z) => (
            <div key={z.zone} style={{ flex: 1, background: z.color, opacity: z.zone === zone.zone && currentHr > 0 ? 1 : 0.3, borderRight: "1px solid #161616" }}></div>
          ))}
        </div>
      </div>

      {/* Removido btn de notes para nao causar aviso showNotes */}

      {finished && (
        <CardioFinishModal 
          tipo={tipo}
          prescribed={prescribed}
          seconds={seconds}
          distance={distance}
          speed={speed}
          incline={incline}
          rpm={rpm}
          resistance={resistance}
          spm={spm}
          totalStrides={totalStrides}
          hrHistory={hrHistory}
          currentNotes={notes}
          onClose={() => setFinished(false)}
        />
      )}
    </div>
  )
}

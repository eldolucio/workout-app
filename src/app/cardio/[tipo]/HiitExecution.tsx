"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Play, Pause, RotateCcw, Flag, Heart, Bluetooth, Edit2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CardioSessionPrescribed } from "@/types/cardio"
import { getHeartZone, formatTime } from "@/lib/cardio"
import { connectHeartRateMonitor, disconnectDevice } from "@/lib/bluetooth"
import CardioFinishModal from "./CardioFinishModal"

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
    bottom: "30px",
    fontFamily: "Barlow Condensed",
    fontSize: "1.25rem",
    textTransform: "uppercase" as const,
    fontWeight: 700,
  },
  roundsText: {
    position: "absolute" as const,
    top: "40px",
    fontFamily: "Barlow",
    color: "#888",
    fontSize: "1rem",
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
  configGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    width: "100%",
    marginTop: "2rem",
  },
  configCard: {
    background: "#161616",
    border: "1px solid #222",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    cursor: "pointer",
  },
  configVal: {
    fontFamily: "Barlow Condensed",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#f0f0f0",
  },
  configLabel: {
    fontFamily: "Barlow",
    fontSize: "0.75rem",
    color: "#555",
    textTransform: "uppercase" as const,
    marginTop: "4px"
  },
  hrSection: {
    width: "100%",
    background: "#161616",
    border: "1px solid #222",
    borderRadius: "12px",
    padding: "16px",
    marginTop: "16px",
  },
}

function ValueEditor({ label, value, min = 1, onSave, onCancel }: any) {
  const [val, setVal] = useState(String(value))
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#161616", padding: "24px", borderRadius: "16px", width: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ color: "#f0f0f0", fontFamily: "Barlow Condensed" }}>{label}</h3>
        <input 
          type="number" step="1" min={min}
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

export default function HiitExecution({ prescribedId }: { prescribedId: string | null }) {
  const router = useRouter()
  
  const [paused, setPaused] = useState(true)
  const [started, setStarted] = useState(false)
  
  const [roundsTotal, setRoundsTotal] = useState(8)
  const [workTime, setWorkTime] = useState(30)
  const [restTime, setRestTime] = useState(30)

  const [currentRound, setCurrentRound] = useState(1)
  const [phase, setPhase] = useState<'work' | 'rest'>('work')
  const [timeLeft, setTimeLeft] = useState(workTime)
  
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0)
  const [prescribed, setPrescribed] = useState<CardioSessionPrescribed | null>(null)
  
  const [hrConnected, setHrConnected] = useState(false)
  const [currentHr, setCurrentHr] = useState(0)
  const [hrHistory, setHrHistory] = useState<number[]>([])
  
  const [editing, setEditing] = useState<{key: string, label: string, val: number} | null>(null)
  const [finished, setFinished] = useState(false)
  
  const btDevice = useRef<BluetoothDevice | null>(null)
  const lastTickTime = useRef<number | null>(null)

  // Recupera backup
  useEffect(() => {
    const saved = localStorage.getItem(`cardio_backup_hiit`)
    if (saved) {
      try {
        const { savedSeconds, lastRound, lastPhase, savedTimeLeft, lastUpdated } = JSON.parse(saved)
        if (Date.now() - lastUpdated < 4 * 60 * 60 * 1000 && savedSeconds > 0 && !finished) {
          if (confirm("Você tem um HIIT em progresso. Deseja restaurar?")) {
            setTotalSecondsElapsed(savedSeconds)
            setCurrentRound(lastRound)
            setPhase(lastPhase)
            setTimeLeft(savedTimeLeft)
            setStarted(true)
          } else {
            localStorage.removeItem(`cardio_backup_hiit`)
          }
        }
      } catch (e) {}
    }
  }, []) // executa ao montar

  // Salva backup
  useEffect(() => {
    if (totalSecondsElapsed > 0 && !finished) {
      localStorage.setItem(`cardio_backup_hiit`, JSON.stringify({ 
        savedSeconds: totalSecondsElapsed,
        lastRound: currentRound,
        lastPhase: phase,
        savedTimeLeft: timeLeft,
        lastUpdated: Date.now() 
      }))
    }
  }, [totalSecondsElapsed, currentRound, phase, timeLeft, finished])

  useEffect(() => {
    async function load() {
      if (prescribedId) {
        const { data } = await supabase.from('cardio_sessions_prescribed').select('*').eq('id', prescribedId).single()
        if (data) {
          setPrescribed(data)
          if (data.rounds) setRoundsTotal(data.rounds)
          if (data.work_seconds) {
            setWorkTime(data.work_seconds)
            setTimeLeft(data.work_seconds)
          }
          if (data.rest_seconds) setRestTime(data.rest_seconds)
        }
      }
    }
    load()
    return () => {
      if (btDevice.current) disconnectDevice(btDevice.current)
    }
  }, [prescribedId])

  useEffect(() => {
    if (paused) {
      lastTickTime.current = null
      return
    }
    
    if (!lastTickTime.current) {
      lastTickTime.current = Date.now()
    }

    const interval = setInterval(() => {
      const now = Date.now()
      if (!lastTickTime.current) lastTickTime.current = now
      
      const diffMs = now - lastTickTime.current
      // Se tiver mais de 1000ms atrasado (ex: o app foi pro background)
      if (diffMs >= 1000) {
        const diffSeconds = 1 // Processa de 1 em 1 segundo para não quebrar a máquina de estados
        lastTickTime.current += diffSeconds * 1000
        
        setTotalSecondsElapsed(s => s + diffSeconds)
        if (currentHr > 0) setHrHistory(prev => [...prev, currentHr])
        
        setTimeLeft(t => {
          if (t > 1) return t - 1
          
          if (phase === 'work') {
            if (currentRound >= roundsTotal) {
              setPaused(true)
              setFinished(true)
              return 0
            } else {
              setPhase('rest')
              return restTime
            }
          } else {
            setPhase('work')
            setCurrentRound(r => r + 1)
            return workTime
          }
        })
      }
    }, 200) // Roda a 200ms para fazer o "catch-up" (avançar rapido) do tempo q ficou pausado no backgroud
    
    return () => clearInterval(interval)
  }, [paused, currentHr, phase, currentRound, roundsTotal, workTime, restTime])

  const handleConnectBT = async () => {
    const device = await connectHeartRateMonitor((bpm) => setCurrentHr(bpm), () => {
      setHrConnected(false)
      setCurrentHr(0)
    })
    if (device) {
      btDevice.current = device
      setHrConnected(true)
    }
  }

  // Visual da barra progressiva
  const totalPhaseTime = phase === 'work' ? workTime : restTime
  const progressPct = Math.min((timeLeft / totalPhaseTime) * 100, 100)
  const dashArray = 200 * Math.PI
  const dashOffset = dashArray - (dashArray * progressPct) / 100
  
  const phaseColor = phase === 'work' ? "#E24B4A" : "#1D9E75" // Vermelho para TRABALHO, Verde para DESCANSO
  const phaseLabel = phase === 'work' ? "AÇÃO" : "DESCANSO"

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => { if(confirm("Descartar sessão?")) router.back() }} style={{background:"none", border:"none", color:"#555"}}><X size={28} /></button>
        <span style={styles.title}>HIIT</span>
        <div style={{width: 28}}></div>
      </header>

      <div style={styles.circleContainer}>
        <svg style={styles.svgCircle} viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="100" fill="none" stroke="#222" strokeWidth="8" />
          <circle 
            cx="110" cy="110" r="100" 
            fill="none" stroke={phaseColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={styles.roundsText}>ROUND {currentRound} / {roundsTotal}</div>
        <div style={{...styles.timerText, color: phaseColor}}>
          {formatTime(timeLeft)}
        </div>
        <div style={{...styles.timerSubtext, color: phaseColor}}>
          {started ? (paused ? "PAUSADO" : phaseLabel) : "PRONTO"}
        </div>
      </div>

      <div style={styles.controlsRow}>
        <button style={styles.secBtn} onClick={() => { 
          if(confirm("Reiniciar HIIT?")) {
            setPaused(true); setStarted(false); setCurrentRound(1); setPhase('work'); setTimeLeft(workTime); setTotalSecondsElapsed(0); setHrHistory([])
          }
        }}>
           <RotateCcw size={20} color="#f0f0f0" />
        </button>
        <button style={styles.playBtn} onClick={() => { setPaused(!paused); setStarted(true) }}>
           {paused ? <Play size={28} color="#000" fill="#000" /> : <Pause size={28} color="#000" fill="#000" />}
        </button>
        <button style={styles.secBtn} onClick={() => setFinished(true)}>
           <Flag size={20} color="#c8f135" />
        </button>
      </div>

      {/* Configurações do HIIT - só editáveis se pausado/não começou */}
      <div style={{...styles.configGrid, opacity: started && !paused ? 0.5 : 1}}>
        <div style={styles.configCard} onClick={() => { if(paused) setEditing({key:'work', label:'Tempo de Ação (segundos)', val:workTime})}}>
          <span style={styles.configVal}>{workTime}s</span>
          <span style={styles.configLabel}>AÇÃO <Edit2 size={10}/></span>
        </div>
        <div style={styles.configCard} onClick={() => { if(paused) setEditing({key:'rest', label:'Tempo de Descanso (segundos)', val:restTime})}}>
          <span style={styles.configVal}>{restTime}s</span>
          <span style={styles.configLabel}>PAUSA <Edit2 size={10}/></span>
        </div>
        <div style={styles.configCard} onClick={() => { if(paused) setEditing({key:'rounds', label:'Total de Rounds', val:roundsTotal})}}>
          <span style={styles.configVal}>{roundsTotal}x</span>
          <span style={styles.configLabel}>ROUNDS <Edit2 size={10}/></span>
        </div>
      </div>

      {editing && (
        <ValueEditor 
          label={editing.label} 
          value={editing.val} 
          onCancel={() => setEditing(null)} 
          onSave={(v: number) => {
            if (editing.key === 'work') { setWorkTime(v); if(phase === 'work' && !started) setTimeLeft(v); }
            if (editing.key === 'rest') { setRestTime(v); if(phase === 'rest' && !started) setTimeLeft(v); }
            if (editing.key === 'rounds') setRoundsTotal(v);
            setEditing(null);
          }} 
        />
      )}

      {/* FC Section (Reaproveitada) */}
      <div style={styles.hrSection}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{fontFamily: "Barlow Condensed", color: "#f0f0f0", display: "flex", alignItems: "center", gap: "8px"}}>
            <Heart size={16} color="#c8f135" /> FREQUÊNCIA CARDÍACA
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
             <span style={{ fontSize: "2.5rem", fontFamily: "Barlow Condensed", fontWeight: 800, color: currentHr > 0 ? getHeartZone(currentHr, 190).color : "#555" }}>
                {currentHr > 0 ? currentHr : "--"}
             </span>
             <span style={{ fontSize: "0.875rem", color: "#555", marginLeft: "4px" }}>bpm</span>
           </div>
        </div>
      </div>

      {finished && (
        <CardioFinishModal 
          tipo="hiit"
          prescribed={prescribed}
          seconds={totalSecondsElapsed}
          distance={0}
          speed={0}
          incline={0}
          rpm={0}
          resistance={0}
          spm={0}
          totalStrides={0}
          hrHistory={hrHistory}
          currentNotes=""
          onClose={() => setFinished(false)}
        />
      )}
    </div>
  )
}

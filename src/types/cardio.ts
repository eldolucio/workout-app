export type CardioType = 'esteira' | 'bike' | 'eliptico' | 'hiit'

export type HeartZone = 'zona1' | 'zona2' | 'zona3' | 'zona4' | 'zona5'

export interface HeartZoneInfo {
  zone: HeartZone
  name: string
  description: string
  minPct: number
  maxPct: number
  color: string
}

export const HEART_ZONES: HeartZoneInfo[] = [
  { zone: 'zona1', name: 'Recuperação',   description: 'Esforço muito leve',   minPct: 50, maxPct: 60, color: '#3B8BD4' },
  { zone: 'zona2', name: 'Base aeróbica', description: 'Queima de gordura',    minPct: 60, maxPct: 70, color: '#1D9E75' },
  { zone: 'zona3', name: 'Aeróbico',      description: 'Condicionamento',      minPct: 70, maxPct: 80, color: '#c8f135' },
  { zone: 'zona4', name: 'Limiar',        description: 'Alta intensidade',     minPct: 80, maxPct: 90, color: '#EF9F27' },
  { zone: 'zona5', name: 'Máximo',        description: 'Esforço máximo',       minPct: 90, maxPct: 100, color: '#E24B4A' },
]

export interface CardioSessionPrescribed {
  id: string
  sheet_id: string
  cardio_type: CardioType
  label: string
  duration_min: number | null
  order_index: number
  notes: string | null
  speed_kmh: number | null
  incline_pct: number | null
  target_dist_km: number | null
  rpm_target: number | null
  resistance: number | null
  spm_target: number | null
  work_seconds: number | null
  rest_seconds: number | null
  rounds: number | null
  effort_level: string | null
}

export interface CardioSessionDone {
  id: string
  user_id: string
  prescribed_id: string | null
  cardio_type: CardioType
  label: string
  started_at: string
  finished_at: string | null
  duration_sec: number | null
  calories: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  heart_zone: string | null
  notes: string | null
  distance_km: number | null
  avg_speed_kmh: number | null
  max_speed_kmh: number | null
  avg_pace_sec: number | null
  incline_pct: number | null
  avg_rpm: number | null
  resistance_used: number | null
  total_strides: number | null
  avg_spm: number | null
  rounds_done: number | null
  work_sec_total: number | null
  rest_sec_total: number | null
}

export interface HiitInterval {
  id?: string
  session_id?: string
  round_number: number
  phase: 'work' | 'rest'
  duration_sec: number
  heart_rate: number | null
  completed: boolean
}

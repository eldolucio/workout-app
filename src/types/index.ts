export interface Profile {
  id: string
  name: string | null
  weight_kg: number | null
  height_cm: number | null
  created_at: string
}

export interface TrainingSheet {
  id: string
  user_id: string
  name: string
  ocr_raw_text: string | null
  source: 'ocr' | 'manual'
  is_active: boolean
  created_at: string
}

export interface TrainingDay {
  id: string
  sheet_id: string
  label: string
  focus: string | null
  order_index: number
}

export interface Exercise {
  id: string
  day_id: string
  name: string
  muscle_group: string | null
  sets: number
  reps: string
  rest_seconds: string | null
  notes: string | null
  order_index: number
}

export interface WorkoutSession {
  id: string
  user_id: string
  training_day_id: string
  started_at: string
  finished_at: string | null
  notes: string | null
}

export interface SessionSet {
  id: string
  session_id: string
  exercise_id: string
  set_number: number
  reps_done: number
  weight_used_kg: number
  completed: boolean
  performed_at: string
}

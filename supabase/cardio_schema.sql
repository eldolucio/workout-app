-- Ficha de cardio prescrita pelo personal
create table if not exists public.cardio_sessions_prescribed (
  id              uuid primary key default gen_random_uuid(),
  sheet_id        uuid references public.training_sheets on delete cascade,
  cardio_type     text not null check (cardio_type in ('esteira','bike','eliptico','hiit')),
  label           text not null,
  duration_min    int,
  order_index     int default 0,
  notes           text,
  -- Esteira
  speed_kmh       float,
  incline_pct     float,
  target_dist_km  float,
  -- Bike
  rpm_target      int,
  resistance      int,
  -- Elíptico
  spm_target      int,
  -- HIIT
  work_seconds    int,
  rest_seconds    int,
  rounds          int,
  effort_level    text check (effort_level in ('leve','moderado','intenso','maximo'))
);

-- Sessão de cardio realizada
create table if not exists public.cardio_sessions_done (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles on delete cascade not null,
  prescribed_id   uuid references public.cardio_sessions_prescribed,
  cardio_type     text not null,
  label           text not null,
  started_at      timestamptz default now(),
  finished_at     timestamptz,
  duration_sec    int,
  -- Métricas gerais
  calories        int,
  avg_heart_rate  int,
  max_heart_rate  int,
  heart_zone      text,
  notes           text,
  -- Esteira
  distance_km     float,
  avg_speed_kmh   float,
  max_speed_kmh   float,
  avg_pace_sec    int,
  incline_pct     float,
  -- Bike
  avg_rpm         int,
  resistance_used int,
  -- Elíptico
  total_strides   int,
  avg_spm         int,
  -- HIIT
  rounds_done     int,
  work_sec_total  int,
  rest_sec_total  int
);

-- Intervalos de HIIT (cada tiro registrado)
create table if not exists public.hiit_intervals (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.cardio_sessions_done on delete cascade,
  round_number    int not null,
  phase           text not null check (phase in ('work','rest')),
  duration_sec    int not null,
  heart_rate      int,
  completed       boolean default false
);

-- RLS
alter table public.cardio_sessions_prescribed enable row level security;
alter table public.cardio_sessions_done       enable row level security;
alter table public.hiit_intervals             enable row level security;

create policy "user_ve_cardio_prescrito"
  on public.cardio_sessions_prescribed for select using (
    sheet_id in (
      select id from public.training_sheets where user_id = auth.uid()
    )
  );

create policy "user_gerencia_propriias_sessoes_cardio"
  on public.cardio_sessions_done for all using (auth.uid() = user_id);

create policy "user_gerencia_proprios_intervalos_hiit"
  on public.hiit_intervals for all using (
    session_id in (
      select id from public.cardio_sessions_done where user_id = auth.uid()
    )
  );

-- Adiciona birth_year em profiles, se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='birth_year') THEN
        ALTER TABLE public.profiles ADD COLUMN birth_year int;
    END IF;
END $$;

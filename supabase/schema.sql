-- Extensão para UUIDs
create extension if not exists "pgcrypto";

create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text,
  avatar_url  text,
  weight_kg   int,
  height_cm   int,
  birth_year  int,
  xp          int default 0,
  level       int default 1,
  created_at  timestamptz default now()
);

-- Ficha de treino importada via OCR
create table public.training_sheets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles on delete cascade not null,
  name         text not null,
  ocr_raw_text text,
  source       text default 'ocr',
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Dia de treino dentro de uma ficha (Treino A, B, C...)
create table public.training_days (
  id          uuid primary key default gen_random_uuid(),
  sheet_id    uuid references public.training_sheets on delete cascade,
  label       text not null,
  focus       text,
  order_index int default 0
);

-- Exercício prescrito na ficha
create table public.exercises (
  id            uuid primary key default gen_random_uuid(),
  day_id        uuid references public.training_days on delete cascade,
  name          text not null,
  muscle_group  text,
  sets          int,
  reps          text,
  rest_seconds  text,
  notes         text,
  order_index   int default 0
);

-- Sessão de treino realizada
create table public.workout_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles on delete cascade not null,
  training_day_id  uuid references public.training_days,
  started_at       timestamptz default now(),
  finished_at      timestamptz,
  notes            text
);

-- Série executada dentro de uma sessão
create table public.session_sets (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.workout_sessions on delete cascade,
  exercise_id     uuid references public.exercises,
  set_number      int,
  reps_done       int,
  weight_used_kg  float,
  completed       boolean default false,
  performed_at    timestamptz default now()
);

-- Trigger: cria perfil automaticamente ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security: cada usuário vê só os próprios dados
alter table public.profiles        enable row level security;
alter table public.training_sheets enable row level security;
alter table public.training_days   enable row level security;
alter table public.exercises       enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_sets    enable row level security;

create policy "user vê próprio perfil"
  on public.profiles for all using (auth.uid() = id);

create policy "user vê próprias fichas"
  on public.training_sheets for all using (auth.uid() = user_id);

create policy "user vê próprios dias"
  on public.training_days for all
  using (sheet_id in (
    select id from public.training_sheets where user_id = auth.uid()
  ));

create policy "user vê próprios exercícios"
  on public.exercises for all
  using (day_id in (
    select id from public.training_days where sheet_id in (
      select id from public.training_sheets where user_id = auth.uid()
    )
  ));

create policy "user vê próprias sessões"
  on public.workout_sessions for all using (auth.uid() = user_id);

create policy "user vê próprias séries"
  on public.session_sets for all
  using (session_id in (
    select id from public.workout_sessions where user_id = auth.uid()
  ));

-- Tabela de assinaturas push
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles on delete cascade not null,
  endpoint    text not null,
  p256dh      text not null,
  auth_key    text not null,
  device_name text,
  created_at  timestamptz default now(),
  unique(endpoint)
);

alter table public.push_subscriptions enable row level security;
create policy "user gerencia push" on public.push_subscriptions for all using (auth.uid() = user_id);

-- Tabela de conquistas do sistema
create table public.achievements (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text not null,
  icon        text,
  xp_reward   int default 0,
  condition   text,
  created_at  timestamptz default now()
);

-- Conquistas desbloqueadas pelo usuário
create table public.user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles on delete cascade not null,
  achievement_id uuid references public.achievements on delete cascade not null,
  unlocked_at    timestamptz default now(),
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;
create policy "user vê conquistas" on public.user_achievements for select using (auth.uid() = user_id);

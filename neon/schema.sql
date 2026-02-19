-- Neon Postgres schema (run in Neon SQL editor)
create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2) not null check (weight_kg > 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('padel', 'running', 'strength', 'other')),
  duration_min integer not null check (duration_min > 0),
  intensity_1_5 numeric(2,1) check (
    intensity_1_5 is null
    or (
      intensity_1_5 >= 1
      and intensity_1_5 <= 5
      and mod((intensity_1_5 * 10)::int, 5) = 0
    )
  ),
  feeling_1_5 numeric(2,1) check (
    feeling_1_5 is null
    or (
      feeling_1_5 >= 1
      and feeling_1_5 <= 5
      and mod((feeling_1_5 * 10)::int, 5) = 0
    )
  ),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists padel_sessions (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null unique references workouts(id) on delete cascade,
  session_format text,
  partner text,
  opponents text,
  results text,
  match_status text check (
    match_status is null
    or match_status in ('win', 'loss', 'unclear', 'aborted')
  ),
  unforced_errors_level text check (
    unforced_errors_level is null
    or unforced_errors_level in ('low', 'medium', 'high')
  ),
  coach_summary text,
  coach_tags text[] not null default '{}',
  tags text[] not null default '{}',
  ball_share numeric(4,3) check (ball_share is null or (ball_share >= 0 and ball_share <= 1)),
  created_at timestamptz not null default now()
);

create table if not exists pain_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  workout_id uuid not null references workouts(id) on delete cascade,
  pain_area text not null check (
    pain_area in ('nacke', 'rygg', 'axel', 'armbåge', 'handled', 'höft', 'knä', 'vad', 'fot', 'annan')
  ),
  pain_intensity_0_10 integer not null check (pain_intensity_0_10 >= 0 and pain_intensity_0_10 <= 10),
  pain_type text check (
    pain_type is null
    or pain_type in ('stelhet', 'skarp', 'molande', 'domning', 'annat')
  ),
  pain_note text,
  created_at timestamptz not null default now()
);

alter table padel_sessions
  add column if not exists match_status text check (
    match_status is null
    or match_status in ('win', 'loss', 'unclear', 'aborted')
  );

alter table padel_sessions add column if not exists coach_summary text;
alter table padel_sessions add column if not exists coach_tags text[] not null default '{}';

create index if not exists idx_weights_user_date on weights(user_id, date desc);
create index if not exists idx_workouts_user_date on workouts(user_id, date desc);
create index if not exists idx_workouts_type on workouts(type);
create index if not exists idx_padel_sessions_workout on padel_sessions(workout_id);
create index if not exists idx_padel_sessions_match_status on padel_sessions(match_status);
create index if not exists idx_pain_logs_user_created on pain_logs(user_id, created_at desc);
create index if not exists idx_pain_logs_workout on pain_logs(workout_id);

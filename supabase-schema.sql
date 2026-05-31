create table if not exists program_days (
  id text primary key,
  owner_id text not null default 'nick',
  title text not null,
  text text not null default '',
  image_url text,
  media_type text not null default 'image',
  fingerprint text,
  file_name text,
  day_created_at text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists workout_sessions (
  id text primary key,
  owner_id text not null default 'nick',
  session_date text not null,
  title text not null,
  workout jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists program_days_updated_at on program_days;
create trigger program_days_updated_at
before update on program_days
for each row execute function set_updated_at();

alter table program_days enable row level security;
alter table workout_sessions enable row level security;

drop policy if exists "single user program days" on program_days;
create policy "single user program days"
on program_days for all
using (owner_id = 'nick')
with check (owner_id = 'nick');

drop policy if exists "single user workout sessions" on workout_sessions;
create policy "single user workout sessions"
on workout_sessions for all
using (owner_id = 'nick')
with check (owner_id = 'nick');

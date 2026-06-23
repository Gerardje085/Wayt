-- ─────────────────────────────────────────────────────────────────────────────
-- Wayt – Supabase Database Setup
-- Run this entire script in the Supabase SQL Editor once.
-- Dashboard → SQL Editor → New query → paste & run.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.users (
    id   integer primary key,
    name text    not null
);

-- Seed the two research participants
insert into public.users (id, name) values
    (1, 'Proefpersoon 1'),
    (2, 'Proefpersoon 2')
on conflict (id) do nothing;

-- 2. WORKOUTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.workouts (
    id       bigserial primary key,
    user_id  integer   not null references public.users(id),
    date     date      not null,
    exercise text      not null,
    sets     integer   not null,
    reps     integer   not null,
    weight   numeric   not null,
    volume   numeric   not null
);

-- Index for fast user+exercise queries
create index if not exists idx_workouts_user_exercise
    on public.workouts (user_id, exercise, date desc);

-- 3. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on both tables
alter table public.users    enable row level security;
alter table public.workouts enable row level security;

-- Allow the anon key to read/write everything
-- (fine for a school project; tighten for production)
create policy "Allow anon select on users"
    on public.users for select to anon using (true);

create policy "Allow anon select on workouts"
    on public.workouts for select to anon using (true);

create policy "Allow anon insert on workouts"
    on public.workouts for insert to anon with check (true);

create policy "Allow anon upsert on users"
    on public.users for insert to anon with check (true);

create policy "Allow anon update on users"
    on public.users for update to anon using (true);

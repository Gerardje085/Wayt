-- ─────────────────────────────────────────────────────────────────────────────
-- Wayt – Supabase Migratiescript (v2 → React Native)
-- Voer dit EENMALIG uit in de Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → plak & voer uit.
--
-- LET OP: Dit verwijdert de oude users-tabel (integer IDs)
-- en maakt een nieuw schema met Supabase Auth (UUID).
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- STAP 1: Verwijder de oude tabellen (voorzichtig!)
-- ─────────────────────────────────────────────────────────────────────────────
drop table if exists public.workouts cascade;
drop table if exists public.users    cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- STAP 2: Maak de profiles tabel (gekoppeld aan auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    username   text,
    group_type text not null check (group_type in ('app', 'gevoel')),
    created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STAP 3: Maak de workouts tabel (UUID user_id, incl. work_joules)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.workouts (
    id          bigserial   primary key,
    user_id     uuid        not null references auth.users(id) on delete cascade,
    date        date        not null default current_date,
    exercise    text        not null,
    sets        integer     not null,
    reps        integer     not null,
    weight      numeric     not null,
    volume      numeric     not null,
    work_joules numeric     not null default 0,
    created_at  timestamptz default now()
);

-- Index voor snelle user+oefening queries
create index idx_workouts_user_exercise
    on public.workouts (user_id, exercise, date desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- STAP 4: Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

-- Profiles: gebruiker kan alleen zijn eigen profiel lezen/schrijven
create policy "Gebruiker leest eigen profiel"
    on public.profiles for select
    to authenticated using (auth.uid() = id);

create policy "Gebruiker maakt eigen profiel"
    on public.profiles for insert
    to authenticated with check (auth.uid() = id);

create policy "Gebruiker wijzigt eigen profiel"
    on public.profiles for update
    to authenticated using (auth.uid() = id);

-- Workouts: gebruiker ziet en schrijft alleen eigen workouts
create policy "Gebruiker leest eigen workouts"
    on public.workouts for select
    to authenticated using (auth.uid() = user_id);

create policy "Gebruiker logt eigen workouts"
    on public.workouts for insert
    to authenticated with check (auth.uid() = user_id);

create policy "Gebruiker verwijdert eigen workouts"
    on public.workouts for delete
    to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STAP 5: Trigger om automatisch een profiel aan te maken bij registratie
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
    insert into public.profiles (id, group_type)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'group_type', 'gevoel')
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

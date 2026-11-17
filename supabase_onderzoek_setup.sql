-- ─────────────────────────────────────────────────────────────────────────────
-- Wayt – Supabase Onderzoek Setup (Deelnemers-trigger & Onderzoeks-RLS)
-- Voer dit volledige script uit in de Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → plak & klik op Run.
-- Idempotent: veilig om meerdere keren uit te voeren.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Zorg dat de tabellen & benodigde kolommen bestaan
create table if not exists public.profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    username   text,
    group_type text not null default 'gevoel' check (group_type in ('app', 'gevoel')),
    role       text not null default 'deelnemer' check (role in ('deelnemer', 'admin')),
    created_at timestamptz not null default now()
);

alter table public.profiles
    add column if not exists username text,
    add column if not exists group_type text not null default 'gevoel',
    add column if not exists role text not null default 'deelnemer';

create table if not exists public.workouts (
    id                bigserial   primary key,
    user_id           uuid        not null references auth.users(id) on delete cascade,
    date              date        not null default current_date,
    exercise          text        not null,
    sets              integer     not null,
    reps              integer     not null,
    weight            numeric     not null,
    volume            numeric     not null,
    work_joules       numeric     not null default 0,
    is_meting         boolean     not null default false,
    test_moment       text,
    rpe               numeric,
    prescribed_weight numeric,
    prescribed_reps   integer,
    prescribed_sets   integer,
    session_id        uuid,
    set_number        integer,
    set_type          text default 'normaal' check (set_type in ('normaal', 'warmup', 'dropset', 'failure')),
    notitie           text,
    created_at        timestamptz not null default now()
);

create index if not exists idx_workouts_user_exercise_date
    on public.workouts (user_id, exercise, date desc);

create index if not exists idx_workouts_session_id
    on public.workouts (session_id);

-- 2. Trigger-functie in niet-blootgesteld schema 'private'
--    Slaat bij elke nieuwe registratie automatisch username (uit raw_user_meta_data->>'username')
--    en group_type ('gevoel') op in public.profiles.
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_username text;
    v_role     text;
begin
    v_username := nullif(trim(new.raw_user_meta_data->>'username'), '');
    -- Rollen komen uitsluitend uit server-beheerde app_metadata (nooit uit user_metadata)
    v_role := case
        when new.raw_app_meta_data->>'role' = 'admin' then 'admin'
        else 'deelnemer'
    end;

    insert into public.profiles (id, username, group_type, role)
    values (
        new.id,
        v_username,
        'gevoel',
        v_role
    )
    on conflict (id) do update
    set
        username   = coalesce(excluded.username, public.profiles.username),
        group_type = coalesce(public.profiles.group_type, 'gevoel');

    return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function private.handle_new_user();

-- Backfill: maak ontbrekende profielen aan voor al geregistreerde accounts
insert into public.profiles (id, username, group_type, role)
select
    u.id,
    nullif(trim(u.raw_user_meta_data->>'username'), ''),
    'gevoel',
    case when u.raw_app_meta_data->>'role' = 'admin' then 'admin' else 'deelnemer' end
from auth.users u
on conflict (id) do update
set
    username = coalesce(public.profiles.username, excluded.username);

-- 3. Row Level Security (RLS) voor onderzoeksdata & admin-simulator
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

-- SELECT: ingelogde gebruikers mogen alle profielen en workouts uitlezen
-- voor het simulator-overzicht en CSV-export in app/admin.tsx.
-- (Let op: voor een publieke productie-app buiten dit PWS-onderzoek beperk je dit tot eigen rijen + admin.)
drop policy if exists "Ingelogde gebruikers lezen alle profielen" on public.profiles;
create policy "Ingelogde gebruikers lezen alle profielen"
    on public.profiles
    for select
    to authenticated
    using (true);

drop policy if exists "Ingelogde gebruikers lezen alle workouts" on public.workouts;
create policy "Ingelogde gebruikers lezen alle workouts"
    on public.workouts
    for select
    to authenticated
    using (true);

-- Schrijfrechten blijven strikt beperkt tot de eigen rijen van de gebruiker
drop policy if exists "Gebruiker maakt eigen profiel" on public.profiles;
create policy "Gebruiker maakt eigen profiel"
    on public.profiles
    for insert
    to authenticated
    with check ((select auth.uid()) = id and role = 'deelnemer');

drop policy if exists "Gebruiker wijzigt eigen profiel" on public.profiles;
create policy "Gebruiker wijzigt eigen profiel"
    on public.profiles
    for update
    to authenticated
    using ((select auth.uid()) = id)
    with check (
        (select auth.uid()) = id
        and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
    );

drop policy if exists "Gebruiker logt eigen workouts" on public.workouts;
create policy "Gebruiker logt eigen workouts"
    on public.workouts
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Gebruiker wijzigt eigen workouts" on public.workouts;
create policy "Gebruiker wijzigt eigen workouts"
    on public.workouts
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Gebruiker verwijdert eigen workouts" on public.workouts;
create policy "Gebruiker verwijdert eigen workouts"
    on public.workouts
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- 4. Optioneel: ken onderzoeker (Zwen) de admin-rol toe zodat app/admin.tsx direct opent
-- Vervang het e-mailadres door Zwen's account en haal de '--' weg:
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'zwen@voorbeeld.nl');

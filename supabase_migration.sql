-- ─────────────────────────────────────────────────────────────────────────────
-- Wayt – Supabase Schema & Admin/Deelnemer RLS (Idempotent uitvoerbaar)
-- Voer dit uit in de Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → plak & voer uit.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabellen & kolommen
create table if not exists public.profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    username   text,
    group_type text not null check (group_type in ('app', 'gevoel')),
    role       text not null default 'deelnemer' check (role in ('deelnemer', 'admin')),
    created_at timestamptz default now()
);

alter table public.profiles
    add column if not exists role text not null default 'deelnemer'
    check (role in ('deelnemer', 'admin'));

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
    created_at        timestamptz default now()
);

alter table public.workouts
    add column if not exists is_meting boolean not null default false,
    add column if not exists session_id uuid,
    add column if not exists set_number integer,
    add column if not exists set_type text default 'normaal' check (set_type in ('normaal', 'warmup', 'dropset', 'failure')),
    add column if not exists notitie text;

create index if not exists idx_workouts_user_exercise
    on public.workouts (user_id, exercise, date desc);

create index if not exists idx_workouts_user_exercise_set
    on public.workouts (user_id, exercise, date desc, set_number asc);

create index if not exists idx_workouts_session
    on public.workouts (session_id);

-- 2. Niet-blootgesteld private schema voor interne SECURITY DEFINER helpers
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.get_my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
    select case
        when auth.uid() is null then null
        else (select p.role from public.profiles p where p.id = auth.uid())
    end;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select auth.uid() is not null
      and exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
      );
$$;

revoke all on function private.get_my_role() from public, anon;
grant execute on function private.get_my_role() to authenticated;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- 3. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

drop policy if exists "Gebruiker leest eigen profiel" on public.profiles;
create policy "Gebruiker leest eigen profiel"
    on public.profiles for select
    to authenticated using ((select auth.uid()) = id);

drop policy if exists "Admin leest alle profielen" on public.profiles;
create policy "Admin leest alle profielen"
    on public.profiles for select
    to authenticated using ((select private.is_admin()));

drop policy if exists "Gebruiker maakt eigen profiel" on public.profiles;
create policy "Gebruiker maakt eigen profiel"
    on public.profiles for insert
    to authenticated with check ((select auth.uid()) = id and role = 'deelnemer');

drop policy if exists "Gebruiker wijzigt eigen profiel" on public.profiles;
create policy "Gebruiker wijzigt eigen profiel"
    on public.profiles for update
    to authenticated
    using ((select auth.uid()) = id)
    with check (
        (select auth.uid()) = id
        and (
            role = coalesce((select private.get_my_role()), 'deelnemer')
            or (select private.is_admin())
        )
    );

drop policy if exists "Gebruiker leest eigen workouts" on public.workouts;
create policy "Gebruiker leest eigen workouts"
    on public.workouts for select
    to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Admin leest alle workouts" on public.workouts;
create policy "Admin leest alle workouts"
    on public.workouts for select
    to authenticated using ((select private.is_admin()));

drop policy if exists "Gebruiker logt eigen workouts" on public.workouts;
create policy "Gebruiker logt eigen workouts"
    on public.workouts for insert
    to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Gebruiker verwijdert eigen workouts" on public.workouts;
create policy "Gebruiker verwijdert eigen workouts"
    on public.workouts for delete
    to authenticated using ((select auth.uid()) = user_id);

-- 4. Trigger om automatisch een profiel aan te maken bij registratie
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
    insert into public.profiles (id, username, group_type, role)
    values (
        new.id,
        nullif(trim(new.raw_user_meta_data->>'username'), ''),
        case when new.raw_user_meta_data->>'group_type' = 'app' then 'app' else 'gevoel' end,
        case when new.raw_app_meta_data->>'role' = 'admin' then 'admin' else 'deelnemer' end
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 5. Maak één account admin (vervang door jouw admin e-mailadres nadat je dat account hebt geregistreerd):
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'jouw-admin@email.nl');

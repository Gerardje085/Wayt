-- ─────────────────────────────────────────────────────────────────────────────
-- Wayt – Migratie v3: onderzoeksbetrouwbaarheid
-- Voer dit EENMALIG uit in de Supabase SQL Editor, vóór je de nieuwe app-build
-- gebruikt. Het script is veilig om nogmaals te draaien: het verwijdert geen data.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extra kolommen op workouts
alter table public.workouts add column if not exists is_meting         boolean not null default false;
alter table public.workouts add column if not exists meting_moment     text;
alter table public.workouts add column if not exists set_type          text    not null default 'normaal';
alter table public.workouts add column if not exists prescribed_sets   integer;
alter table public.workouts add column if not exists prescribed_reps   integer;
alter table public.workouts add column if not exists prescribed_weight numeric;

alter table public.workouts drop constraint if exists workouts_meting_moment_check;
alter table public.workouts add  constraint workouts_meting_moment_check
    check (meting_moment is null or meting_moment in ('week0', 'week6'));

alter table public.workouts drop constraint if exists workouts_set_type_check;
alter table public.workouts add  constraint workouts_set_type_check
    check (set_type in ('normaal', 'warmup', 'dropset', 'failure'));

-- 2. Onderzoekersrol op profiles
alter table public.profiles add column if not exists is_onderzoeker boolean not null default false;

create or replace function public.is_onderzoeker()
returns boolean
language sql security definer stable set search_path = public
as $$
    select coalesce((select p.is_onderzoeker from public.profiles p where p.id = auth.uid()), false);
$$;

-- 3. Deelnemers mogen hun eigen groep of rol niet meer aanpassen
drop policy if exists "Gebruiker wijzigt eigen profiel" on public.profiles;
drop policy if exists "Gebruiker maakt eigen profiel"   on public.profiles;

-- 4. Onderzoekers mogen alle profielen en workouts lezen (voor A/B-analyse en export)
drop policy if exists "Onderzoeker leest alle profielen" on public.profiles;
create policy "Onderzoeker leest alle profielen"
    on public.profiles for select
    to authenticated using (public.is_onderzoeker());

drop policy if exists "Onderzoeker leest alle workouts" on public.workouts;
create policy "Onderzoeker leest alle workouts"
    on public.workouts for select
    to authenticated using (public.is_onderzoeker());

-- 5. Groepsindeling volledig server-side en gebalanceerd.
--    Nieuwe deelnemer gaat naar de groep met de minste deelnemers (bij gelijkstand: Algoritme).
--    Onderzoekersaccounts tellen niet mee. De app stuurt geen groepskeuze meer mee.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
    aantal_app    integer;
    aantal_gevoel integer;
begin
    perform pg_advisory_xact_lock(hashtext('wayt_groepsindeling'));

    select count(*) filter (where group_type = 'app'),
           count(*) filter (where group_type = 'gevoel')
      into aantal_app, aantal_gevoel
      from public.profiles
     where is_onderzoeker = false;

    insert into public.profiles (id, group_type)
    values (new.id, case when aantal_app <= aantal_gevoel then 'app' else 'gevoel' end);

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 6. Oude metingen met legacy-ID's omzetten naar de ID's die de app nu gebruikt
update public.workouts set exercise = '0025' where exercise = 'bench_press';
update public.workouts set exercise = '0150' where exercise = 'lat_pulldown';
update public.workouts set exercise = '0585' where exercise = 'leg_extension';

-- ─────────────────────────────────────────────────────────────────────────────
-- Daarna: jezelf (en je groepsgenoten) als onderzoeker markeren.
-- Vervang het e-mailadres en voer per account uit:
--
-- update public.profiles set is_onderzoeker = true
--  where id = (select id from auth.users where email = 'jouw@email.nl');
--
-- Controle groepsverdeling:
--
-- select group_type, count(*) from public.profiles
--  where is_onderzoeker = false group by group_type;
-- ─────────────────────────────────────────────────────────────────────────────

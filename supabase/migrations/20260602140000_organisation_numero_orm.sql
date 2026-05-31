-- ============================================================================
-- Revue 2026 (correctif C13) — Identifiant public ORM+5 des organisations.
-- ============================================================================
--
-- Cohérence avec les identifiants publics : individu M+7 (profil_unifie),
-- organisation ORM+5 (« ORManisation », évite « OM »), cf. CDC §17 et
-- organisations-V2. Format `^ORM[A-Z0-9]{5}$` (36^5 ≈ 60 millions).
--
-- Réutilise `numero_contient_terme_interdit` (migration profil_unifie). Trigger
-- BEFORE INSERT pose le numéro si absent ; backfill des organisations
-- existantes ligne par ligne (anti-collision fiable). Migration ADDITIVE
-- (colonne + trigger + backfill), aucune donnée métier touchée. Local d'abord.
-- ============================================================================

alter table public.organisation
  add column if not exists numero_organisation text;

create unique index if not exists organisation_numero_unique
  on public.organisation (numero_organisation)
  where numero_organisation is not null;

alter table public.organisation drop constraint if exists organisation_numero_format;
alter table public.organisation
  add constraint organisation_numero_format
  check (numero_organisation is null or numero_organisation ~ '^ORM[A-Z0-9]{5}$');

-- Génère un numéro « ORM » + 5 caractères alphanumériques, unique et acceptable.
create or replace function public.generer_numero_organisation()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  candidat text;
  i int;
  existe boolean;
begin
  loop
    candidat := 'ORM';
    for i in 1..5 loop
      candidat := candidat || substr(alphabet, 1 + floor(random() * 36)::int, 1);
    end loop;
    if public.numero_contient_terme_interdit(candidat) then
      continue;
    end if;
    select exists(
      select 1 from public.organisation where numero_organisation = candidat
    ) into existe;
    exit when not existe;
  end loop;
  return candidat;
end;
$$;

comment on function public.generer_numero_organisation() is
  'Génère un identifiant ORM + 5 caractères alphanumériques, unique et non offensant (C13, revue 2026).';

-- Trigger : pose le numéro à la création si l'application ne l'a pas fourni.
create or replace function public.tg_organisation_numero()
returns trigger
language plpgsql
as $$
begin
  if new.numero_organisation is null or new.numero_organisation = '' then
    new.numero_organisation := public.generer_numero_organisation();
  end if;
  return new;
end;
$$;

drop trigger if exists organisation_numero on public.organisation;
create trigger organisation_numero
  before insert on public.organisation
  for each row execute function public.tg_organisation_numero();

-- Backfill des organisations existantes (ligne par ligne : chaque génération
-- voit les numéros déjà posés dans la même transaction, anti-collision fiable).
do $$
declare
  r record;
begin
  for r in select id from public.organisation where numero_organisation is null loop
    update public.organisation
      set numero_organisation = public.generer_numero_organisation()
      where id = r.id;
  end loop;
end;
$$;

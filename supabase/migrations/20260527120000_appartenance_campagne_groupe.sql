-- Table `appartenance_campagne` (cycle V2 V2.3.29).
--
-- Doctrine V2 §6 : chaque sous-espace qui accumule des membres mérite
-- sa table d'appartenance. La campagne est le dernier sous-espace sans
-- appartenance dédiée (les communes, fédérations, confédérations, GT,
-- groupes d'entraide locaux en ont déjà une).
--
-- Pattern aligné sur `appartenance_commune` (personne_id, espace_id,
-- rejointe_le, quittee_le, est_active). L'index unique partiel garantit
-- qu'une personne n'a qu'une appartenance active à la fois.
--
-- Note : `appartenance_groupe_entraide_local` existe DÉJÀ en V1 avec
-- `rejoint_le`/`quitte_le`/`role_groupe`. Pas de migration à poser
-- pour les groupes d'entraide ; on lit la table V1 directement.
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit.

create table if not exists public.appartenance_campagne (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references public.personne(id) on delete cascade,
  campagne_id uuid not null references public.campagne(id) on delete cascade,
  rejointe_le timestamptz not null default now(),
  quittee_le timestamptz,
  est_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.appartenance_campagne is
  'Appartenance d''une personne à une campagne (V2.3.29). Pattern aligné sur appartenance_commune.';

create index if not exists appartenance_campagne_personne_idx
  on public.appartenance_campagne (personne_id)
  where est_active = true;

create index if not exists appartenance_campagne_campagne_idx
  on public.appartenance_campagne (campagne_id)
  where est_active = true;

-- Unicité : une personne n'a qu'une appartenance active par campagne.
create unique index if not exists appartenance_campagne_unique_active
  on public.appartenance_campagne (personne_id, campagne_id)
  where est_active = true;

alter table public.appartenance_campagne enable row level security;

drop policy if exists "appartenance_campagne_select_public" on public.appartenance_campagne;
create policy "appartenance_campagne_select_public"
  on public.appartenance_campagne
  for select
  using (true);

drop policy if exists "appartenance_campagne_insert_self" on public.appartenance_campagne;
create policy "appartenance_campagne_insert_self"
  on public.appartenance_campagne
  for insert
  with check (personne_id = auth.uid());

drop policy if exists "appartenance_campagne_update_self" on public.appartenance_campagne;
create policy "appartenance_campagne_update_self"
  on public.appartenance_campagne
  for update
  using (personne_id = auth.uid())
  with check (personne_id = auth.uid());

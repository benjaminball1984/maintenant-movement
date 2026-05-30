-- ============================================================================
-- Chantier V2.6.14 (épopée réseau V2, chantier B.2) — Gestionnaires d'espace
-- ============================================================================
--
-- Cf. docs/specs/09_RESEAU-SOCIAL-V2.md §7.2.
--
-- Rôle de GESTIONNAIRE polymorphe (espace_type, espace_id), posé d'abord pour
-- les organisations (B.1). Décisions arbitrées avec Lilou/Ben le 30/05 :
--   - Badge officiel : l'admin accorde le PREMIER, puis cooptation entre
--     gestionnaires d'une organisation DÉJÀ officielle (voie 2).
--   - Droits gestionnaire : tenir la page + initier des contenus rattachés
--     + gérer les autres gestionnaires.
--
-- Toutes les mutations sensibles passent par des fonctions SECURITY DEFINER
-- (la RLS de la table interdit l'écriture directe) : on garde la logique de
-- gouvernance en un seul endroit, vérifiable.
--
-- Migration LOCALE (non poussée au distant avant la Phase M).
-- ============================================================================

-- ============================================================
-- Table : gestionnaire_espace (polymorphe)
-- ============================================================
create table if not exists public.gestionnaire_espace (
  id           uuid primary key default gen_random_uuid(),
  espace_type  text not null,
  espace_id    uuid not null,
  personne_id  uuid not null references public.personne(id) on delete cascade,
  statut       text not null default 'actif',
  -- Attestation sur l'honneur d'être habilité·e (anti-usurpation, le badge
  -- officiel reste accordé séparément par l'admin).
  attestation  boolean not null default false,
  cree_le      timestamptz not null default now(),

  constraint gestionnaire_espace_type_valide check (espace_type in (
    'commune', 'federation', 'confederation', 'gt_thematique',
    'groupe_entraide_local', 'campagne', 'organisation'
  )),
  constraint gestionnaire_espace_statut_valide check (statut in ('actif', 'retire')),
  constraint gestionnaire_espace_unique unique (espace_type, espace_id, personne_id)
);

comment on table public.gestionnaire_espace is
  'Gestionnaires d''un espace (polymorphe). B.2 : organisations. Mutations via fonctions SECURITY DEFINER.';

create index if not exists gestionnaire_espace_cible_idx
  on public.gestionnaire_espace (espace_type, espace_id, statut);
create index if not exists gestionnaire_espace_personne_idx
  on public.gestionnaire_espace (personne_id, statut);

-- ============================================================
-- RLS : lecture publique (qui gère un espace), écriture via fonctions seulement
-- ============================================================
alter table public.gestionnaire_espace enable row level security;

drop policy if exists "gestionnaire_espace_select" on public.gestionnaire_espace;
create policy "gestionnaire_espace_select" on public.gestionnaire_espace for select
  using (true);
-- Pas de policy insert/update/delete : seules les fonctions SECURITY DEFINER
-- ci-dessous écrivent (l'admin garde un accès via est_admin_general dans ces
-- fonctions).

-- ============================================================
-- Helper : le lecteur courant est-il gestionnaire actif de cet espace ?
-- ============================================================
create or replace function public.est_gestionnaire_espace(p_espace_type text, p_espace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gestionnaire_espace g
    where g.espace_type = p_espace_type
      and g.espace_id = p_espace_id
      and g.personne_id = auth.uid()
      and g.statut = 'actif'
  );
$$;

comment on function public.est_gestionnaire_espace(text, uuid) is
  'True si le lecteur courant est gestionnaire actif de l''espace (espace_type, espace_id).';

revoke execute on function public.est_gestionnaire_espace(text, uuid) from public;
grant execute on function public.est_gestionnaire_espace(text, uuid) to authenticated, service_role;

-- ============================================================
-- Bootstrap : le·la créateur·ice d'une organisation en devient gestionnaire
-- ============================================================
-- Appelé juste après la création (cf. creerOrganisationAction). Vérifie que
-- l'appelant·e EST le·la créateur·ice et qu'aucun gestionnaire n'existe encore.
create or replace function public.bootstrap_gestionnaire_organisation(p_org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_createur uuid;
  v_existe boolean;
begin
  select cree_par into v_createur from public.organisation where id = p_org_id;
  if v_createur is null or v_createur <> auth.uid() then
    return false;
  end if;
  select exists (
    select 1 from public.gestionnaire_espace
    where espace_type = 'organisation' and espace_id = p_org_id and statut = 'actif'
  ) into v_existe;
  if v_existe then
    return false; -- déjà un gestionnaire (idempotent côté appelant)
  end if;
  insert into public.gestionnaire_espace (espace_type, espace_id, personne_id, attestation)
    values ('organisation', p_org_id, auth.uid(), true)
    on conflict (espace_type, espace_id, personne_id)
      do update set statut = 'actif';
  return true;
end;
$$;

comment on function public.bootstrap_gestionnaire_organisation(uuid) is
  'Le·la créateur·ice d''une organisation en devient gestionnaire (appelé après création).';

revoke execute on function public.bootstrap_gestionnaire_organisation(uuid) from public;
grant execute on function public.bootstrap_gestionnaire_organisation(uuid) to authenticated, service_role;

-- ============================================================
-- Cooptation : un gestionnaire d'une organisation OFFICIELLE en ajoute un autre
-- ============================================================
create or replace function public.coopter_gestionnaire_organisation(
  p_org_id uuid,
  p_personne_cible uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_officielle boolean;
begin
  -- L'appelant doit être gestionnaire actif de l'organisation.
  if not public.est_gestionnaire_espace('organisation', p_org_id) then
    return false;
  end if;
  -- La cooptation n'est ouverte qu'une fois l'organisation officialisée (voie 2).
  select badge_officiel into v_officielle from public.organisation where id = p_org_id;
  if v_officielle is not true then
    return false;
  end if;
  if p_personne_cible is null then
    return false;
  end if;
  insert into public.gestionnaire_espace (espace_type, espace_id, personne_id, attestation)
    values ('organisation', p_org_id, p_personne_cible, false)
    on conflict (espace_type, espace_id, personne_id)
      do update set statut = 'actif';
  return true;
end;
$$;

comment on function public.coopter_gestionnaire_organisation(uuid, uuid) is
  'Un gestionnaire d''une organisation officielle coopte une autre personne gestionnaire (voie 2).';

revoke execute on function public.coopter_gestionnaire_organisation(uuid, uuid) from public;
grant execute on function public.coopter_gestionnaire_organisation(uuid, uuid) to authenticated, service_role;

-- ============================================================
-- Retrait : un gestionnaire en retire un autre (jamais le dernier), ou admin
-- ============================================================
create or replace function public.retirer_gestionnaire(p_gestionnaire_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
  v_espace uuid;
  v_actifs int;
begin
  select espace_type, espace_id into v_type, v_espace
    from public.gestionnaire_espace where id = p_gestionnaire_id and statut = 'actif';
  if not found then
    return false;
  end if;
  -- Droit : être gestionnaire actif du même espace, ou admin.
  if not (public.est_gestionnaire_espace(v_type, v_espace) or public.est_admin_general()) then
    return false;
  end if;
  -- Ne jamais retirer le dernier gestionnaire actif (l'espace serait orphelin).
  select count(*) into v_actifs
    from public.gestionnaire_espace
    where espace_type = v_type and espace_id = v_espace and statut = 'actif';
  if v_actifs <= 1 then
    return false;
  end if;
  update public.gestionnaire_espace set statut = 'retire' where id = p_gestionnaire_id;
  return true;
end;
$$;

comment on function public.retirer_gestionnaire(uuid) is
  'Retire un gestionnaire (réservé à un gestionnaire du même espace ou à l''admin ; jamais le dernier).';

revoke execute on function public.retirer_gestionnaire(uuid) from public;
grant execute on function public.retirer_gestionnaire(uuid) to authenticated, service_role;

-- ============================================================
-- Badge officiel : accordé / retiré par l'admin uniquement
-- ============================================================
create or replace function public.definir_badge_officiel_organisation(
  p_org_id uuid,
  p_officiel boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_admin_general() then
    return false;
  end if;
  update public.organisation set badge_officiel = p_officiel where id = p_org_id;
  return found;
end;
$$;

comment on function public.definir_badge_officiel_organisation(uuid, boolean) is
  'Accorde (ou retire) le badge officiel d''une organisation. Réservé à l''admin (voie 2).';

revoke execute on function public.definir_badge_officiel_organisation(uuid, boolean) from public;
grant execute on function public.definir_badge_officiel_organisation(uuid, boolean) to authenticated, service_role;

-- ============================================================
-- Élévation : la mise à jour d'une organisation est ouverte aux gestionnaires
-- ============================================================
drop policy if exists "organisation_update" on public.organisation;
create policy "organisation_update" on public.organisation for update
  using (
    cree_par = auth.uid()
    or public.est_gestionnaire_espace('organisation', id)
    or public.est_admin_general()
  )
  with check (
    cree_par = auth.uid()
    or public.est_gestionnaire_espace('organisation', id)
    or public.est_admin_general()
  );

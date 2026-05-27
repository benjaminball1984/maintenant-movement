-- Table `fil_groupe_message` : fil de discussion collectif transversal
-- (cycle V2 §18 des principes-transversaux-V2.md, chantier V2.2.1).
--
-- Distinct de la messagerie individuelle (`message_reseau`, V1) : TOUT
-- groupe / espace (commune, campagne, GT, groupe d'entraide, groupe de
-- prêt, covoit'groupe…) dispose d'un fil de discussion commun pour
-- coordonner, partager des liens, organiser. Sans ce fil, un groupe ne
-- peut pas vraiment vivre (§18 V2).
--
-- Choix de modélisation : un fil = (espace_type, espace_id) implicite.
-- Pas de table `fil_groupe` séparée — on stocke directement les messages
-- avec leur paire d'appartenance. La table est extensible : on ajoute
-- une valeur de `espace_type` quand un nouveau type d'espace apparaît
-- (esprit D13 V2).
--
-- À appliquer avec `supabase db push`. DDL pur. Non appliquée au distant
-- cette nuit (consigne).

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.fil_groupe_message (
  id uuid primary key default gen_random_uuid(),

  -- Espace auquel ce message appartient. Liste fermée extensible (D13).
  -- L'identifiant est typé `uuid` car tous les espaces du repo utilisent
  -- des UUID (cf. `commune.id`, `campagne.id`, etc.).
  espace_type text not null check (espace_type in (
    'commune',
    'federation',
    'confederation',
    'campagne',
    'gt_thematique',
    'groupe_entraide_local'
  )),
  espace_id uuid not null,

  -- Auteur du message (compte authentifié, donc lié à `personne` / `auth.users`).
  -- Les signataires sans compte ne peuvent pas poster dans un fil de groupe.
  auteur_id uuid not null references public.personne(id) on delete cascade,

  -- Contenu textuel. Pas de pièce jointe à ce stade (le composant client
  -- peut référencer des URL d'images ou de documents via le contenu).
  -- La taille max est cohérente avec celle du réseau social V1.
  contenu text not null check (length(contenu) between 1 and 4000),

  -- Réponse à un message précédent (fil filé). Optionnel.
  parent_id uuid references public.fil_groupe_message(id) on delete set null,

  -- Soft delete pour les messages modérés / supprimés (audit conservé).
  supprime_le timestamptz,
  supprime_par uuid references public.personne(id) on delete set null,
  motif_suppression text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.fil_groupe_message is
  'Fil de discussion collectif transversal V2 §18. Un fil = (espace_type, espace_id) implicite.';
comment on column public.fil_groupe_message.parent_id is
  'Réponse à un message précédent. NULL = message racine du fil.';
comment on column public.fil_groupe_message.supprime_le is
  'Soft delete (modération). NULL = message actif. Audit conservé.';

-- ============================================================
-- Index
-- ============================================================
-- Lecture chronologique d'un fil (cas le plus fréquent).
create index if not exists fil_groupe_message_espace_idx
  on public.fil_groupe_message (espace_type, espace_id, created_at desc)
  where supprime_le is null;

-- Lecture des messages d'un auteur (audit, profil contributions).
create index if not exists fil_groupe_message_auteur_idx
  on public.fil_groupe_message (auteur_id, created_at desc)
  where supprime_le is null;

-- Lecture des réponses à un message (fil filé).
create index if not exists fil_groupe_message_parent_idx
  on public.fil_groupe_message (parent_id)
  where parent_id is not null;

-- ============================================================
-- Trigger : maintien automatique de `updated_at`
-- ============================================================
create or replace function public.fil_groupe_message_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fil_groupe_message_updated_at_trigger
  on public.fil_groupe_message;
create trigger fil_groupe_message_updated_at_trigger
  before update on public.fil_groupe_message
  for each row
  execute function public.fil_groupe_message_set_updated_at();

-- ============================================================
-- Helper SQL : est_membre_espace(espace_type, espace_id)
-- ============================================================
-- Centralise la vérification d'appartenance pour les policies RLS.
-- Utilisée par fil_groupe_message et utilisable par d'autres entités
-- transversales V2 ultérieures.
--
-- VERSION CORRIGÉE (intégrée directement depuis la migration de fix
-- `20260527080000_est_membre_espace_fix.sql` après détection en review
-- du bug : `appartenance_federation` lie une COMMUNE à une fédération,
-- pas une personne directement, donc `personne_id` n'existe pas
-- dessus). La migration de fix reste idempotente (CREATE OR REPLACE) :
-- elle ré-applique le même corps, sans incidence.
create or replace function public.est_membre_espace(
  espace_type_a_verifier text,
  espace_id_a_verifier uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case espace_type_a_verifier
    when 'commune' then
      exists (
        select 1 from public.appartenance_commune
        where personne_id = auth.uid()
          and commune_id = espace_id_a_verifier
          and est_active = true
      )
    when 'federation' then
      exists (
        select 1
        from public.appartenance_commune ac
        join public.appartenance_federation af
          on af.commune_id = ac.commune_id
         and af.est_active = true
        where ac.personne_id = auth.uid()
          and ac.est_active = true
          and af.federation_id = espace_id_a_verifier
      )
    when 'confederation' then
      exists (
        select 1
        from public.appartenance_commune ac
        join public.appartenance_federation af
          on af.commune_id = ac.commune_id
         and af.est_active = true
        join public.appartenance_confederation aconf
          on aconf.federation_id = af.federation_id
         and aconf.est_active = true
        where ac.personne_id = auth.uid()
          and ac.est_active = true
          and aconf.confederation_id = espace_id_a_verifier
      )
    when 'gt_thematique' then
      exists (
        select 1 from public.appartenance_gt
        where personne_id = auth.uid()
          and gt_thematique_id = espace_id_a_verifier
          and est_active = true
      )
    -- Pour campagne et groupe_entraide_local : pas d'appartenance dédiée
    -- en V1. Tout authentifié peut participer en attendant la modélisation
    -- d'une appartenance explicite (chantier V2 dédié).
    when 'campagne' then auth.uid() is not null
    when 'groupe_entraide_local' then auth.uid() is not null
    else false
  end;
$$;

comment on function public.est_membre_espace(text, uuid) is
  'Vérifie si la personne connectée est membre d''un espace. Centralise les checks par espace_type. V2.3.8 : jointures transitives pour federation/confederation, gt_thematique_id (et non gt_id).';

-- ============================================================
-- RLS
-- ============================================================
alter table public.fil_groupe_message enable row level security;

-- Lecture : seuls les membres de l'espace voient le fil (le fil de
-- groupe n'est PAS public — c'est de la coordination interne).
-- Les admins voient tout (modération).
drop policy if exists "fil_groupe_message_select_membres" on public.fil_groupe_message;
create policy "fil_groupe_message_select_membres"
  on public.fil_groupe_message
  for select
  using (
    public.est_admin_general()
    or public.est_moderateurice('reseau')
    or public.est_membre_espace(espace_type, espace_id)
  );

-- Insertion : seuls les membres de l'espace peuvent poster.
-- `auteur_id` doit correspondre à la session.
drop policy if exists "fil_groupe_message_insert_membres" on public.fil_groupe_message;
create policy "fil_groupe_message_insert_membres"
  on public.fil_groupe_message
  for insert
  with check (
    auteur_id = auth.uid()
    and public.est_membre_espace(espace_type, espace_id)
    and supprime_le is null
  );

-- Mise à jour : l'auteur peut éditer son message (correction de typo,
-- précision) tant qu'il n'est pas supprimé. Pas de modification par
-- d'autres (sauf modération via update du soft delete).
drop policy if exists "fil_groupe_message_update_auteur" on public.fil_groupe_message;
create policy "fil_groupe_message_update_auteur"
  on public.fil_groupe_message
  for update
  using (auteur_id = auth.uid() and supprime_le is null)
  with check (auteur_id = auth.uid());

-- Modération : un modérateur peut « supprimer » (soft delete) n'importe
-- quel message du fil. Policy séparée pour clarté d'audit.
drop policy if exists "fil_groupe_message_moderer" on public.fil_groupe_message;
create policy "fil_groupe_message_moderer"
  on public.fil_groupe_message
  for update
  using (public.est_admin_general() or public.est_moderateurice('reseau'))
  with check (public.est_admin_general() or public.est_moderateurice('reseau'));

-- Suppression dure : interdite côté policy (soft delete via update est la
-- méthode officielle). Seuls les admins peuvent purger en cas d'absolue
-- nécessité (RGPD §17 effacement).
drop policy if exists "fil_groupe_message_delete_admin" on public.fil_groupe_message;
create policy "fil_groupe_message_delete_admin"
  on public.fil_groupe_message
  for delete
  using (public.est_admin_general());

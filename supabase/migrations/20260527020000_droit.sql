-- Table `droit` : permissions atomiques par paire (profil, cible) (cycle V2, D10).
--
-- Cycle V2 chantier V2.1.3. Implémente D10 du schema-donnees-V2.md +
-- MD1-MD6 de matrice-droits-V2.md :
--
--   « Droits atomiques en base (une permission = une action précise, cases
--    indépendantes conformes au §9), ET regroupés en presets (modèles)
--    pour l'attribution courante. »
--
-- Coexistence avec la table V1 `droit_admin` (chantier 1.1) : on greffe
-- la table V2 à côté, on ne touche pas à la V1. Les helpers RLS V1
-- (`est_admin_general`, `est_moderateurice`, etc.) continuent de lire
-- `droit_admin` tant que la migration applicative vers `droit` n'est pas
-- faite, chantier par chantier. Doctrine de greffe respectée (interdit
-- n°1 : on additionne, on ne soustrait jamais).
--
-- À appliquer avec `supabase db push` ou `scripts/appliquer-sql-distant.ts`.
-- DDL pur, sans PII. Le script de backfill associé est dans
-- `scripts/backfill-droits.ts` (`--dry-run` obligatoire par défaut).

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.droit (
  id uuid primary key default gen_random_uuid(),

  -- Personne à qui le droit est accordé. FK auth.users via personne (cohérent
  -- avec `droit_admin.personne_id`). Les droits de PLATEFORME sont attribués
  -- à des comptes authentifiés, pas à des signataires sans compte.
  personne_id uuid not null references public.personne(id) on delete cascade,

  -- Cible du droit : un objet ou un espace (MD2 V2). Liste fermée extensible
  -- (esprit D13 V2). NULL côté `cible_type` quand le droit est global
  -- (admin total / membre du Cercle d'admin plateforme — MD5).
  cible_type text check (cible_type is null or cible_type in (
    'espace_commune',
    'espace_federation',
    'espace_confederation',
    'espace_campagne',
    'espace_gt',
    'objet_petition',
    'objet_mobilisation',
    'objet_cagnotte',
    'objet_moment_solidaire',
    'objet_article',
    'objet_offre_marche',
    'objet_offre_entraide',
    'objet_service_sel',
    'objet_sondage',
    'plateforme'
  )),
  cible_id uuid,

  -- Permission précise. Liste fermée extensible (cf. MD1 V2). Une ligne =
  -- une permission atomique sur une cible précise. Pour accorder plusieurs
  -- droits d'un coup, on insère plusieurs lignes (cf. presets côté
  -- `lib/droit-presets.ts`).
  type_droit text not null check (type_droit in (
    -- Contenu / rédaction
    'ecrire_article',
    'modifier_article_propre',
    'modifier_article_autrui',
    'supprimer_article',
    'publier_mini_blog',
    -- Objets
    'creer_objet',
    'modifier_objet',
    'supprimer_objet',
    'telecharger_fichier',
    'gerer_image',
    -- Modération
    'moderer_a_priori',
    'moderer_a_posteriori',
    'moderer_editorial',
    'traiter_signalement',
    -- Média
    'selectionner_pour_media',
    'editorialiser',
    'mega_edito',
    -- Membres / espace
    'gerer_membres',
    'gerer_mandataires',
    'administrer_espace',
    'gerer_droits',
    -- Finance / caisse
    'gerer_caisse',
    'valider_reversement',
    'consulter_journal',
    -- Admin plateforme (MD5)
    'admin_total_plateforme'
  )),

  -- Traçabilité : qui a accordé, quand, et soft delete via `retire_le`.
  -- Cohérent avec `droit_admin` : on ne hard-delete jamais (audit RGPD +
  -- contrôle des privilèges, MD3 traçabilité obligatoire).
  accorde_par uuid references public.personne(id) on delete set null,
  accorde_le timestamptz not null default now(),
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,

  -- Métadonnées libres : preset d'origine (`backfill_droit_admin_v1`,
  -- `preset_redacteurice`, etc.), motif, contexte.
  metadata jsonb not null default '{}'::jsonb,

  -- Cohérence : si `cible_type` est NULL (droit global), `cible_id` aussi.
  constraint droit_cible_coherente
    check ((cible_type is null and cible_id is null) or (cible_type is not null))
);

comment on table public.droit is
  'Permissions atomiques V2 (D10/MD1). Coexiste avec droit_admin V1. Soft delete via retire_le.';
comment on column public.droit.type_droit is
  'Permission précise (liste MD1). Plusieurs lignes pour accorder un preset.';
comment on column public.droit.cible_type is
  'Type de cible (espace, objet, plateforme). NULL = droit global (admin total).';

-- ============================================================
-- Index
-- ============================================================
-- Recherche des droits actifs d'une personne (cas le plus fréquent : RLS).
create index if not exists droit_personne_actifs_idx
  on public.droit (personne_id, type_droit)
  where retire_le is null;

-- Recherche par cible (« qui a quel droit sur cette pétition ? »).
create index if not exists droit_cible_actifs_idx
  on public.droit (cible_type, cible_id, type_droit)
  where retire_le is null and cible_id is not null;

-- Index unique partiel : un droit actif identique (personne × type × cible)
-- ne peut exister qu'une fois. On utilise COALESCE pour traiter NULL cible
-- comme valeur distincte (cohérent avec V2.1.2 consentement).
create unique index if not exists droit_unique_actif
  on public.droit (
    personne_id,
    type_droit,
    coalesce(cible_type, ''),
    coalesce(cible_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where retire_le is null;

-- ============================================================
-- RLS dans la migration même (cohérent avec V2.1.2 et le retour
-- d'expérience revue 21/05).
-- ============================================================
alter table public.droit enable row level security;

-- Lecture : la personne voit ses propres droits ; les admins voient tout
-- (utile pour le journal et l'audit).
drop policy if exists "droit_select_self_admin" on public.droit;
create policy "droit_select_self_admin"
  on public.droit
  for select
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_dpd()
  );

-- Insertion : seuls les admins peuvent accorder un droit. La règle
-- « non-élévation » (MD3) et le verrou `gerer_droits` sont à enforcer
-- côté Server Action (helper `lib/droit.ts`), pas côté RLS qui ne sait
-- pas vérifier la sous-relation entre droits accordés et accordés. La
-- RLS est ici la deuxième ligne de défense (qui peut écrire) ; les
-- règles métier viennent en première ligne.
drop policy if exists "droit_insert_admin" on public.droit;
create policy "droit_insert_admin"
  on public.droit
  for insert
  with check (public.est_admin_general());

-- Mise à jour : idem.
drop policy if exists "droit_update_admin" on public.droit;
create policy "droit_update_admin"
  on public.droit
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

-- Suppression : interdite côté policy (soft delete via `retire_le` est la
-- méthode officielle, cohérent avec `droit_admin`). Une suppression dure
-- exigerait un admin général.
drop policy if exists "droit_delete_admin" on public.droit;
create policy "droit_delete_admin"
  on public.droit
  for delete
  using (public.est_admin_general());

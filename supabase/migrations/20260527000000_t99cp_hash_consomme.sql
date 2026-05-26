-- Garde-fou anti-réutilisation des hashes de transactions T99CP / Polygon.
--
-- Cycle V2 chantier V2.1.1 (§19 des principes-transversaux-V2.md) :
-- la plateforme ne signe AUCUNE transaction. Elle vérifie seulement les
-- hashes au retour du wallet externe. Pour empêcher qu'un même hash soit
-- consommé deux fois (double-spend applicatif), on consigne chaque hash
-- au moment où un flux applicatif (adhésion, don, marché, SEL...) le
-- prend en compte. L'unicité est garantie par la clé primaire.
--
-- À appliquer avec `supabase db push` ou `scripts/appliquer-sql-distant.ts`.
-- DDL pur, sans PII (les hashes Polygon sont publics par construction).

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.t99cp_hash_consomme (
  -- Le hash de la transaction Polygon en hexadécimal préfixé 0x.
  -- 0x + 64 chars = 66 chars. On reste en `text` pour ne pas avoir à
  -- recompiler le type au cas où une autre chaîne nous renvoie une
  -- forme différente, mais on contraint la longueur et le préfixe.
  tx_hash text primary key check (
    tx_hash like '0x%' and length(tx_hash) between 4 and 128
  ),

  -- Type de flux applicatif qui a consommé ce hash. Liste extensible (esprit
  -- D13 V2 : listes de référence, jamais du champ libre).
  consomme_par_type text not null check (consomme_par_type in (
    'adhesion',
    'don',
    'cagnotte',
    'marche_solidaire',
    'sel',
    'autre'
  )),

  -- Identifiant interne de l'objet métier qui a consommé le hash. Nullable
  -- car certains flux (`autre`) peuvent ne pas avoir d'objet identifié.
  consomme_par_id uuid,

  -- Profil ayant déclenché la consommation (FK auth.users via la convention
  -- du repo, cohérent avec `signature_petition.personne_id`).
  consomme_par_profil_id uuid references auth.users(id) on delete set null,

  consomme_le timestamptz not null default now(),

  -- Métadonnées libres : montant, adresse de destination vérifiée, etc.
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.t99cp_hash_consomme is
  'Anti-réutilisation des hashes T99CP/Polygon. Cycle V2 §19. Append-only.';
comment on column public.t99cp_hash_consomme.tx_hash is
  'Hash hexadécimal de la transaction Polygon (0x...). Clé primaire = unicité globale.';
comment on column public.t99cp_hash_consomme.consomme_par_type is
  'Type de flux applicatif consommateur. Liste fermée extensible.';

-- ============================================================
-- Index
-- ============================================================
-- Recherche par type + récent en tête (audit, dashboard admin).
create index if not exists t99cp_hash_consomme_par_type_idx
  on public.t99cp_hash_consomme(consomme_par_type, consomme_le desc);

-- Recherche par profil (audit personnel).
create index if not exists t99cp_hash_consomme_par_profil_idx
  on public.t99cp_hash_consomme(consomme_par_profil_id);

-- ============================================================
-- RLS : table sensible, lecture admin uniquement, écriture via
-- service_role seulement (les Server Actions authentifiées passent par
-- ce rôle pour les opérations privilégiées, comme pour `journal_admin`).
-- ============================================================
alter table public.t99cp_hash_consomme enable row level security;

drop policy if exists "t99cp_hash_consomme_select_admin"
  on public.t99cp_hash_consomme;
create policy "t99cp_hash_consomme_select_admin"
  on public.t99cp_hash_consomme
  for select
  using (
    -- Admins généraux peuvent tout voir.
    public.est_admin_general()
    -- Modérateurs avec onglet 'autres-moyens' (où T99CP s'inscrit) peuvent voir.
    or public.est_moderateurice('autres-moyens')
    -- Une personne peut voir SES propres consommations (audit personnel).
    or auth.uid() = consomme_par_profil_id
  );

-- Aucune policy insert/update/delete : seul le service_role peut écrire,
-- via les Server Actions qui consomment un hash. Cohérent avec le pattern
-- de `journal_admin` (append-only, accès écriture privilégié).

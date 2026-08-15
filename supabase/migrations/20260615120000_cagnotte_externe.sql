-- Table `cagnotte_externe` : curation de collectes hébergées sur d'autres
-- plateformes (Ulule, MiiMOSA, LITA…), demande Ben 2026-06-15.
--
-- Greffe ADDITIVE : aucune table existante touchée. Ces collectes ne sont PAS
-- des cagnottes Maintenant! (table `cagnotte`) : ce sont des liens sortants
-- relayés, en SOUTIEN à des causes alignées sur le mouvement.
--
-- Modération A PRIORI (consigne Ben) : le cron insère en `statut='propose'`
-- (invisible du public) ; rien n'est public tant qu'un·e admin n'a pas validé
-- (`statut='publie'`). Un candidat rejeté (`statut='refuse'`) reste en base
-- pour ne JAMAIS être re-proposé (anti-doublon par `source_url`).

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.cagnotte_externe (
  id uuid primary key default gen_random_uuid(),

  -- Contenu affiché (aperçu MINIMAL : on renvoie vers la source, on n'héberge pas).
  titre text not null check (length(titre) between 1 and 300),
  resume text check (resume is null or length(resume) <= 2000),
  organisateur text check (organisateur is null or length(organisateur) <= 300),

  -- Plateforme d'origine (badge + provenance) et lien sortant (idempotence).
  plateforme text not null check (length(plateforme) <= 80),
  source_url text not null unique,

  -- Jauge de collecte, si exposée par la source.
  objectif_centimes bigint check (objectif_centimes is null or objectif_centimes >= 0),
  collecte_centimes bigint check (collecte_centimes is null or collecte_centimes >= 0),
  devise text not null default 'EUR' check (length(devise) <= 8),
  pourcentage numeric(6, 2) check (pourcentage is null or pourcentage >= 0),
  echeance timestamptz,

  -- Visuel de la source (URL, non recopiée dans notre bucket).
  vignette_url text,

  -- Curation : thèmes détectés et type de collecte (aide à la modération).
  themes text[] not null default '{}',
  type_collecte text check (type_collecte is null or length(type_collecte) <= 40),

  -- Modération a priori. `propose` = NON public. Seul `publie` est visible.
  statut text not null default 'propose' check (statut in ('propose', 'publie', 'refuse')),
  modere_par uuid references public.personne(id) on delete set null,
  modere_le timestamptz,
  raison_refus text check (raison_refus is null or length(raison_refus) <= 500),

  -- Métadonnées libres (id source, catégorie brute de la plateforme…).
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cagnotte_externe is
  'Collectes externes relayées (curation + modération a priori, V2.6.124). Liens sortants, ne pas confondre avec la table cagnotte (cagnottes maison).';

-- ============================================================
-- Index
-- ============================================================
-- Affichage public : les collectes validées, les plus récentes d'abord.
create index if not exists cagnotte_externe_publie_idx
  on public.cagnotte_externe (statut, created_at desc);

-- File de modération : les propositions en attente.
create index if not exists cagnotte_externe_propose_idx
  on public.cagnotte_externe (created_at desc)
  where statut = 'propose';

-- Filtre par thème (puces de la section publique).
create index if not exists cagnotte_externe_themes_idx
  on public.cagnotte_externe using gin (themes);

-- ============================================================
-- Trigger updated_at
-- ============================================================
create or replace function public.cagnotte_externe_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cagnotte_externe_updated_at on public.cagnotte_externe;
create trigger cagnotte_externe_updated_at
  before update on public.cagnotte_externe
  for each row execute function public.cagnotte_externe_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.cagnotte_externe enable row level security;

-- Lecture : tout le monde voit les collectes VALIDÉES ; l'admin voit tout
-- (propositions en attente comprises, pour la modération).
drop policy if exists "cagnotte_externe_select" on public.cagnotte_externe;
create policy "cagnotte_externe_select"
  on public.cagnotte_externe
  for select
  using (statut = 'publie' or public.est_admin_general());

-- Insertion : interdite côté client. Seul le cron (service_role) insère.
drop policy if exists "cagnotte_externe_insert_blocked" on public.cagnotte_externe;
create policy "cagnotte_externe_insert_blocked"
  on public.cagnotte_externe
  for insert
  with check (false);

-- Mise à jour : admin national uniquement (approuver / rejeter / éditer).
drop policy if exists "cagnotte_externe_update_admin" on public.cagnotte_externe;
create policy "cagnotte_externe_update_admin"
  on public.cagnotte_externe
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

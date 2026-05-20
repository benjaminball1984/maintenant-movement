-- Migration 003 : table `commune`.
--
-- Entité territoriale de base du mouvement. Deux sources de création :
--   - pre_creee : importée depuis le CSV des 2100-2300 communes pré-créées
--                 (chantier 5.2, fourni par Lilou/Ben).
--   - auto_creee : créée à la main par une personne (territoire libre,
--                  commune supplémentaire, quartier, ZAD, etc.).
--
-- Le slug est l'identifiant URL stable (cf. routing `/agir/communes/[slug]`).

create table public.commune (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  nom text not null,

  -- Géolocalisation (nullable : un territoire libre peut ne pas avoir
  -- toutes ces données ; le CSV pré-créé les remplira pour les vraies communes).
  code_insee text,
  code_postal_principal text,
  departement text,
  region text,
  latitude double precision,
  longitude double precision,

  -- Présentation
  description_courte text,
  image_url text,

  -- Provenance
  statut_creation text not null default 'auto_creee',
  createurice_id uuid references public.personne(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint commune_statut_creation_valide
    check (statut_creation in ('pre_creee', 'auto_creee')),
  -- Le slug est URL-safe : minuscules + alphanum + tiret.
  constraint commune_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.commune is 'Commune libre (territoriale ou libre). Slug unique pour le routing.';
comment on column public.commune.statut_creation is 'pre_creee (import CSV chantier 5.2) | auto_creee (créée par la communauté)';

create index commune_departement_idx on public.commune (departement) where departement is not null;
create index commune_statut_creation_idx on public.commune (statut_creation);
create index commune_geo_idx on public.commune (latitude, longitude)
  where latitude is not null and longitude is not null;

create trigger commune_updated_at
  before update on public.commune
  for each row
  execute function public.tg_set_updated_at();

alter table public.commune enable row level security;

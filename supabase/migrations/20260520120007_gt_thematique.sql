-- Migration 007 : groupes de travail thématiques + appartenance.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §7B (« Trois niveaux supra-locaux ») :
-- les GT thématiques agrègent des individus (pas des communes) autour
-- d'un sujet (climat, féminisme, anti-racisme, logement, etc.).

create table public.gt_thematique (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  sujet text not null,
  description text,
  image_url text,

  createurice_id uuid references public.personne(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint gt_thematique_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.gt_thematique is 'Groupe de travail thématique. Agrège des personnes (pas des communes).';

create trigger gt_thematique_updated_at
  before update on public.gt_thematique
  for each row
  execute function public.tg_set_updated_at();

alter table public.gt_thematique enable row level security;

-- ============================================================
-- Appartenance d'une personne à un GT thématique
-- ============================================================
create table public.appartenance_gt (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references public.personne(id) on delete cascade,
  gt_thematique_id uuid not null references public.gt_thematique(id) on delete cascade,

  rejointe_le timestamptz not null default now(),
  quittee_le timestamptz,
  est_active boolean not null default true,

  created_at timestamptz not null default now(),

  constraint appartenance_gt_unique_active
    unique (personne_id, gt_thematique_id, est_active)
    deferrable initially deferred,
  constraint appartenance_gt_coherence_active
    check (
      (est_active = true and quittee_le is null)
      or (est_active = false and quittee_le is not null)
    )
);

create index appartenance_gt_personne_idx
  on public.appartenance_gt (personne_id) where est_active;
create index appartenance_gt_gt_idx
  on public.appartenance_gt (gt_thematique_id) where est_active;

alter table public.appartenance_gt enable row level security;

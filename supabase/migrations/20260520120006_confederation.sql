-- Migration 006 : confédérations + appartenances de fédérations aux confédérations.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §7B (« Trois niveaux supra-locaux ») :
-- les confédérations agrègent des fédérations. La récursivité au-delà est
-- prévue par le modèle (une confédération pourrait techniquement être
-- elle-même fédérée), mais on s'en tient à un niveau de plus pour 1.1.

create table public.confederation (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  description_courte text,
  image_url text,

  createurice_id uuid references public.personne(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint confederation_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.confederation is 'Confédération de fédérations. L''Assemblée Confédérale est composée de délégué·es des communes, fédérations et confédérations (cf. spec §7B).';

create trigger confederation_updated_at
  before update on public.confederation
  for each row
  execute function public.tg_set_updated_at();

alter table public.confederation enable row level security;

-- ============================================================
-- Appartenance d'une fédération à une confédération
-- ============================================================
create table public.appartenance_confederation (
  id uuid primary key default gen_random_uuid(),
  federation_id uuid not null references public.federation(id) on delete cascade,
  confederation_id uuid not null references public.confederation(id) on delete cascade,

  rejointe_le timestamptz not null default now(),
  quittee_le timestamptz,
  est_active boolean not null default true,

  created_at timestamptz not null default now(),

  constraint appartenance_confederation_unique_active
    unique (federation_id, confederation_id, est_active)
    deferrable initially deferred,
  constraint appartenance_confederation_coherence_active
    check (
      (est_active = true and quittee_le is null)
      or (est_active = false and quittee_le is not null)
    )
);

create index appartenance_confederation_federation_idx
  on public.appartenance_confederation (federation_id) where est_active;
create index appartenance_confederation_confederation_idx
  on public.appartenance_confederation (confederation_id) where est_active;

alter table public.appartenance_confederation enable row level security;

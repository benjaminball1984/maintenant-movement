-- Migration 005 : fédérations + appartenances de communes aux fédérations.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §7B :
--   - Pas de continuité territoriale obligatoire.
--   - Pas de limite de nombre de fédérations par commune.
--   - Subsidiarité par accord mutuel.
--   - Type : géographique, thématique, ou mixte (libre).

create table public.federation (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  type text not null default 'mixte',
  description_courte text,
  image_url text,

  createurice_id uuid references public.personne(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint federation_type_valide
    check (type in ('geographique', 'thematique', 'mixte')),
  constraint federation_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.federation is 'Fédération de communes. Type libre (géo / théma / mixte).';

create index federation_type_idx on public.federation (type);

create trigger federation_updated_at
  before update on public.federation
  for each row
  execute function public.tg_set_updated_at();

alter table public.federation enable row level security;

-- ============================================================
-- Appartenance d'une commune à une fédération
-- ============================================================
create table public.appartenance_federation (
  id uuid primary key default gen_random_uuid(),
  commune_id uuid not null references public.commune(id) on delete cascade,
  federation_id uuid not null references public.federation(id) on delete cascade,

  rejointe_le timestamptz not null default now(),
  quittee_le timestamptz,
  est_active boolean not null default true,

  created_at timestamptz not null default now(),

  constraint appartenance_federation_unique_active
    unique (commune_id, federation_id, est_active)
    deferrable initially deferred,
  constraint appartenance_federation_coherence_active
    check (
      (est_active = true and quittee_le is null)
      or (est_active = false and quittee_le is not null)
    )
);

comment on table public.appartenance_federation is 'Lien N-N commune ↔ fédération. Pas de limite de nombre (subsidiarité libre).';

create index appartenance_federation_commune_idx
  on public.appartenance_federation (commune_id) where est_active;
create index appartenance_federation_federation_idx
  on public.appartenance_federation (federation_id) where est_active;

alter table public.appartenance_federation enable row level security;

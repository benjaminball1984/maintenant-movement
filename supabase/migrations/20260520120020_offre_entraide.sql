-- Migration 020 : table `offre_entraide` (chantier 4.1).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §6A-D :
--   A. Hébergement solidaire
--   B. Transport solidaire (covoiturage)
--   C. Qui prête tout + Repair Café
--   D. Fruits de la terre + Frigos solidaires
--
-- Les 4 sous-espaces partagent le même modèle d'offre :
--   titre, description, géolocalisation, contact via messagerie interne.
-- D'où une seule table polymorphe `offre_entraide` avec un `type` discriminant.
-- Les frigos solidaires et Repair Café (sous-types de C et D) sont des
-- features ultérieures (4.1bis) avec leurs propres tables annexes
-- (`registre_frigo`, etc.).
--
-- Sens : « propose » (je donne / je prête / j'héberge) ou « cherche »
-- (j'ai besoin de). Permet de croiser les besoins et les offres dans la
-- même fiche.
--
-- Modération a posteriori (cf. spec §11) : publication immédiate, retrait
-- ou clôture par la créatrice ou modé.

create table public.offre_entraide (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  description text not null,
  image_url text,

  -- Discriminant : 4 types couvrant les 4 sous-espaces de §6A-D.
  type text not null,

  -- Direction : ai-je quelque chose à offrir, ou est-ce que je cherche ?
  sens text not null,

  -- Géolocalisation. Lieu libre + lat/lng optionnels (carte unifiée).
  lieu text not null,
  latitude double precision,
  longitude double precision,

  -- Métadonnées propres à chaque type (capacité d'hébergement,
  -- itinéraire transport, durée de prêt, etc.). JSONB pour rester
  -- extensible sans migration à chaque nouveau champ.
  meta jsonb not null default '{}'::jsonb,

  -- Provenance
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- État opérationnel
  statut text not null default 'publiee',
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,
  raison_retrait text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint offre_type_valide
    check (type in ('hebergement', 'transport', 'pret_objet', 'fruits_terre')),
  constraint offre_sens_valide
    check (sens in ('propose', 'cherche')),
  constraint offre_statut_valide
    check (statut in ('publiee', 'retiree', 'cloturee')),
  constraint offre_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint offre_lat_valide
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint offre_lng_valide
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint offre_geo_coherent
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    ),
  constraint offre_retrait_coherent
    check (
      (statut = 'retiree' and raison_retrait is not null)
      or statut <> 'retiree'
    ),
  constraint offre_retrait_meta_coherent
    check (
      (retire_par is null and retire_le is null)
      or (retire_par is not null and retire_le is not null)
    )
);

comment on table public.offre_entraide is
  'Offre d''entraide (hébergement, transport, prêt d''objet, fruits de la terre). Modération a posteriori.';
comment on column public.offre_entraide.type is 'hebergement | transport | pret_objet | fruits_terre';
comment on column public.offre_entraide.sens is 'propose (j''offre) | cherche (je demande)';

create index offre_entraide_type_idx on public.offre_entraide (type, statut);
create index offre_entraide_sens_idx on public.offre_entraide (sens) where statut = 'publiee';
create index offre_entraide_createurice_idx on public.offre_entraide (createurice_id);
create index offre_entraide_geo_idx on public.offre_entraide (latitude, longitude)
  where statut = 'publiee' and latitude is not null;
create index offre_entraide_publiee_recente_idx on public.offre_entraide (created_at desc)
  where statut = 'publiee';

create trigger offre_entraide_updated_at
  before update on public.offre_entraide
  for each row
  execute function public.tg_set_updated_at();

alter table public.offre_entraide enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : publiées = public ; créatrice voit ses retirées/cloturées ;
-- modé/admin voient tout (les 3 statuts).
create policy "offre_entraide_select"
  on public.offre_entraide for select
  using (
    statut in ('publiee', 'cloturee')
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('entraide')
  );

create policy "offre_entraide_insert_auth"
  on public.offre_entraide for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

-- Mise à jour : créatrice peut éditer son offre (titre, description,
-- image, etc.) tant qu'elle est publiée. Statut suit par Server Action.
create policy "offre_entraide_update"
  on public.offre_entraide for update
  using (
    (createurice_id = auth.uid() and statut = 'publiee')
    or public.est_admin_general()
    or public.est_moderateurice('entraide')
  );

-- Pas de DELETE : on retire ou on clôture, on ne supprime pas
-- (cohérence avec mobilisations / cagnottes).

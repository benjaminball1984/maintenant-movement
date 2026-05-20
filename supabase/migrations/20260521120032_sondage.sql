-- Migration 032 : Sondages (chantier 7.4).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §4D :
--   « Création simple, ajout photo. Vote connecté obligatoire. Panel
--     sociodémo + politique. 2 modes :
--       - Classique : vote brut.
--       - Pondéré : à partir de 300 répondant·es, méthode des quotas. »
--
-- Modèle :
--   - sondage : titre, question, options (text[]), image_url, mode,
--     statut, createurice.
--   - reponse_sondage : 1 vote par personne (UNIQUE). Stocke aussi
--     les variables sociodémo (code postal, tranche d'âge,
--     pronom_optionnel) pour le mode pondéré.

create table public.sondage (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  titre text not null,
  question text not null,
  -- Options : tableau de 2 à 10 propositions. PostgreSQL text[].
  options text[] not null,
  image_url text,

  -- 'classique' (vote brut) | 'pondere' (méthode des quotas dès 300 répondant·es).
  mode text not null default 'classique',

  -- Localité (optionnelle) : sondage national OU rattaché à une commune.
  commune_id uuid references public.commune(id) on delete set null,

  -- Géolocalisation (carte unifiée chantier 6.1 enrichi).
  latitude double precision,
  longitude double precision,

  createurice_id uuid not null references public.personne(id) on delete cascade,

  statut text not null default 'ouvert',
  ferme_le timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sondage_mode_valide
    check (mode in ('classique', 'pondere')),
  constraint sondage_statut_valide
    check (statut in ('ouvert', 'ferme', 'archive', 'retire')),
  constraint sondage_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint sondage_options_nombre
    check (array_length(options, 1) between 2 and 10),
  constraint sondage_lat_valide
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint sondage_lng_valide
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint sondage_geo_coherent
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    )
);

comment on table public.sondage is
  'Sondages Maintenant! — 2 modes (classique = vote brut, pondéré = méthode des quotas dès 300 répondant·es). Vote connecté obligatoire.';

create index sondage_statut_idx on public.sondage (statut, created_at desc);
create index sondage_commune_idx on public.sondage (commune_id) where statut = 'ouvert';
create index sondage_geo_idx on public.sondage (latitude, longitude)
  where statut = 'ouvert' and latitude is not null;

create trigger sondage_updated_at
  before update on public.sondage
  for each row
  execute function public.tg_set_updated_at();

alter table public.sondage enable row level security;

create policy "sondage_select"
  on public.sondage for select
  using (
    statut in ('ouvert', 'ferme', 'archive')
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('sondages')
  );

create policy "sondage_insert"
  on public.sondage for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

create policy "sondage_update"
  on public.sondage for update
  using (
    (createurice_id = auth.uid() and statut = 'ouvert')
    or public.est_admin_general()
    or public.est_moderateurice('sondages')
  );

-- ============================================================
-- Réponses aux sondages
-- ============================================================

create table public.reponse_sondage (
  id uuid primary key default gen_random_uuid(),

  sondage_id uuid not null references public.sondage(id) on delete cascade,
  personne_id uuid not null references public.personne(id) on delete cascade,

  -- Index 0-based dans le tableau `options` du sondage.
  option_index integer not null,

  -- Variables sociodémo / politiques pour le mode pondéré.
  -- Optionnelles (la personne peut refuser de les renseigner).
  code_postal text,
  tranche_age text,
  pronom text,
  genre_declare text,

  created_at timestamptz not null default now(),

  -- Un seul vote par personne et par sondage.
  constraint reponse_sondage_unique unique (sondage_id, personne_id),
  constraint reponse_sondage_option_positif check (option_index >= 0),
  constraint reponse_sondage_tranche_age_valide
    check (
      tranche_age is null
      or tranche_age in ('moins_18', '18_24', '25_34', '35_49', '50_64', '65_plus')
    ),
  constraint reponse_sondage_cp_format
    check (code_postal is null or code_postal ~ '^\d{5}$')
);

comment on table public.reponse_sondage is
  'Vote sur un sondage. 1 vote par personne. Variables sociodémo optionnelles pour le mode pondéré (spec §4D).';

create index reponse_sondage_sondage_idx on public.reponse_sondage (sondage_id);
create index reponse_sondage_personne_idx on public.reponse_sondage (personne_id);

alter table public.reponse_sondage enable row level security;

-- Lecture des réponses : la personne voit son propre vote ; l'agrégat
-- est exposé par une vue. Pas d'accès individuel pour les autres
-- (anonymat des votes).
create policy "reponse_sondage_select"
  on public.reponse_sondage for select
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('sondages')
  );

create policy "reponse_sondage_insert"
  on public.reponse_sondage for insert
  with check (
    auth.uid() is not null
    and personne_id = auth.uid()
  );

-- ============================================================
-- Vue d'agrégation : nombre de votes par option + total.
-- Lecture publique (transparence des résultats agrégés).
-- ============================================================
create or replace view public.sondage_resultats as
select
  r.sondage_id,
  r.option_index,
  count(*)::int as nombre_votes
from public.reponse_sondage r
group by r.sondage_id, r.option_index;

comment on view public.sondage_resultats is
  'Agrégation des votes par sondage et par option. Mode classique : on l’expose tel quel. Mode pondéré : le calcul est fait côté app à partir de cette vue + des variables sociodémo.';

grant select on public.sondage_resultats to anon, authenticated;

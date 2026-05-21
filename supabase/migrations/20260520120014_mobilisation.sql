-- Migration 014 : table `mobilisation`.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §5C et docs/specs/08_PLAN_CHANTIERS.md
-- (chantier 3.2) :
--   - Modération a posteriori (publication immédiate, retrait si problème).
--   - Géolocalisé (lat/lng + libellé du lieu) pour la carte unifiée.
--   - « Je participe » d'un clic, anonyme par défaut (table dédiée 015).
--
-- Cycle de vie :
--   publiee  → retiree (manuel par modé/admin/créateurice)
--   retiree  → (terminal, mais ré-publication possible via update du
--               statut par admin)

create table public.mobilisation (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  description text not null,
  image_url text,

  -- Géolocalisation. PostGIS n'est pas activé sur l'instance Supabase
  -- de base : on stocke lat/lng en double precision, ce qui couvre
  -- amplement la précision utile (les rayons d'agrégation cartographiques
  -- sont calculés côté carte).
  lieu text not null,                       -- libellé humain (ex : « Place de la République, Paris 11e »)
  latitude double precision,                -- WGS84, -90..90
  longitude double precision,               -- WGS84, -180..180

  -- Calendrier. `date_fin` est optionnel (événement ponctuel sans heure
  -- de fin officielle). Si renseigné, doit être >= date_debut.
  date_debut timestamptz not null,
  date_fin timestamptz,

  -- Provenance
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- Modération a posteriori
  statut text not null default 'publiee',
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,
  raison_retrait text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mobilisation_statut_valide
    check (statut in ('publiee', 'retiree')),
  constraint mobilisation_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint mobilisation_lat_valide
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint mobilisation_lng_valide
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  -- Coordonnées : tout ou rien (jamais une seule des deux renseignée).
  constraint mobilisation_geo_coherent
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    ),
  constraint mobilisation_dates_coherentes
    check (date_fin is null or date_fin >= date_debut),
  -- Cohérence : si statut = retiree, raison_retrait doit être renseigné.
  constraint mobilisation_retrait_coherent
    check (
      (statut = 'retiree' and raison_retrait is not null)
      or statut <> 'retiree'
    ),
  -- Cohérence : retire_par et retire_le vont ensemble.
  constraint mobilisation_retrait_meta_coherent
    check (
      (retire_par is null and retire_le is null)
      or (retire_par is not null and retire_le is not null)
    )
);

comment on table public.mobilisation is 'Mobilisation (rassemblement, action de rue, manif, AG...). Modération a posteriori. Géolocalisée.';
comment on column public.mobilisation.statut is 'publiee | retiree';

-- Index pour les requêtes courantes :
--   - récentes / à venir (filtre statut + tri date_debut)
--   - par créateurice (pour /profil/contributions)
--   - géo (latitude+longitude pour la carte ; mais double precision sans
--     GIST/PostGIS — on assume un volume modeste, la carte filtre côté app).
create index mobilisation_statut_idx on public.mobilisation (statut);
create index mobilisation_createurice_idx on public.mobilisation (createurice_id);
create index mobilisation_a_venir_idx on public.mobilisation (date_debut)
  where statut = 'publiee';
create index mobilisation_geo_idx on public.mobilisation (latitude, longitude)
  where statut = 'publiee' and latitude is not null;

create trigger mobilisation_updated_at
  before update on public.mobilisation
  for each row
  execute function public.tg_set_updated_at();

alter table public.mobilisation enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : publiées = lecture publique ; créateurice voit aussi ses
-- retirées (pour comprendre le retrait et corriger) ; modé/admin voient tout.
create policy "mobilisation_select"
  on public.mobilisation for select
  using (
    statut = 'publiee'
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('mobilisations')
  );

-- Création : auth requise. Le statut initial est `publiee` par défaut
-- (modération a posteriori). On force createurice_id = auth.uid() en
-- complément du DEFAULT.
create policy "mobilisation_insert_auth"
  on public.mobilisation for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

-- Mise à jour : la créateurice peut éditer sa mobilisation publiée tant
-- que la date_debut n'est pas dépassée (cohérence éditoriale). Modé/admin
-- peuvent toujours mettre à jour (notamment pour le retrait).
create policy "mobilisation_update"
  on public.mobilisation for update
  using (
    (createurice_id = auth.uid() and statut = 'publiee' and date_debut > now())
    or public.est_admin_general()
    or public.est_moderateurice('mobilisations')
  );

-- Pas de DELETE : on retire (statut = 'retiree') plutôt que supprimer.
-- Préserve l'historique politique (qui a annoncé quoi, retiré quand).

-- Migration 029 : moment_solidaire (chantier 5.3).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §7C « Moments solidaires » :
--   - 8 types : porte-à-porte (génération auto 7 RDV), maraude
--     solidaire, vide-grenier solidaire, soutien, manifestation,
--     rencontre, concert solidaire, repas solidaire.
--   - Permissions : organiser = membre de la commune territoriale ;
--     participer = libre, incitation à laisser ses coordonnées.
--   - Cf. Tupperwares à ramener : variante actée du porte-à-porte.
--
-- Modèle polymorphe identique à `offre_entraide` (4.1) : un type
-- discriminant, des `meta` JSONB pour les champs spécifiques (capacité
-- maximale d'un repas, type de cause locale, etc.).
--
-- Le porte-à-porte solidaire en 7 moments est représenté par un
-- `moment_solidaire` parent (`type = 'porte_a_porte'`) auquel sont
-- rattachés 7 enfants via `parent_id`. La génération auto est faite
-- par la Server Action (transaction unique).

create table public.moment_solidaire (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  description text not null,

  -- Discriminant (8 types de la spec §7C).
  type text not null,

  -- Sous-type pour les enfants du porte-à-porte (1er passage, tri,
  -- distribution, etc.). Null pour les moments autonomes.
  sous_type text,

  -- Quand on est un enfant d'un porte-à-porte parent.
  parent_id uuid references public.moment_solidaire(id) on delete cascade,

  -- Géolocalisation : lieu humain + lat/lng (carte unifiée).
  lieu text not null,
  latitude double precision,
  longitude double precision,

  -- Plage temporelle. `termine_le` optionnel pour les moments sans fin
  -- précise (rencontre, soutien long, etc.).
  commence_le timestamptz not null,
  termine_le timestamptz,

  -- Commune territoriale concernée (organiser = membre).
  commune_id uuid references public.commune(id) on delete set null,

  -- Cause locale liée (optionnel). Champ libre v1 ; sera une FK quand
  -- la table `cause_locale` existera (chantier polish).
  cause_locale text,

  -- Capacité maximale (vide = pas de limite). Pour repas, manifestation
  -- déclarée avec quota, etc.
  capacite_max integer,

  -- Métadonnées spécifiques au type (liste de produits demandés pour
  -- le 1er passage caddie, organisateurice contact, etc.).
  meta jsonb not null default '{}'::jsonb,

  -- Provenance
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- État opérationnel
  statut text not null default 'annonce',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint moment_type_valide
    check (type in (
      'porte_a_porte',
      'maraude',
      'vide_grenier_solidaire',
      'soutien',
      'manifestation',
      'rencontre',
      'concert_solidaire',
      'repas_solidaire'
    )),
  constraint moment_statut_valide
    check (statut in ('annonce', 'en_cours', 'termine', 'annule', 'retire')),
  constraint moment_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint moment_lat_valide
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint moment_lng_valide
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint moment_geo_coherent
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    ),
  constraint moment_dates_coherentes
    check (termine_le is null or commence_le <= termine_le),
  constraint moment_capacite_positive
    check (capacite_max is null or capacite_max > 0)
);

comment on table public.moment_solidaire is
  'Moment solidaire (porte-à-porte + 7 autres types). Polymorphe via `type`. Cf. spec §7C.';
comment on column public.moment_solidaire.parent_id is
  'Référence vers le moment porte-à-porte parent quand on est un des 7 RDV enfants.';
comment on column public.moment_solidaire.sous_type is
  '1er_passage | 2e_passage | tri | distribution | maraude_invit | repas | volontaires (pour les enfants du porte-à-porte). null pour les autres types.';

create index moment_type_idx on public.moment_solidaire (type, commence_le);
create index moment_statut_idx on public.moment_solidaire (statut) where statut in ('annonce', 'en_cours');
create index moment_parent_idx on public.moment_solidaire (parent_id) where parent_id is not null;
create index moment_commune_idx on public.moment_solidaire (commune_id);
create index moment_a_venir_idx on public.moment_solidaire (commence_le)
  where statut in ('annonce', 'en_cours');
create index moment_geo_idx on public.moment_solidaire (latitude, longitude)
  where statut in ('annonce', 'en_cours') and latitude is not null;

create trigger moment_solidaire_updated_at
  before update on public.moment_solidaire
  for each row
  execute function public.tg_set_updated_at();

alter table public.moment_solidaire enable row level security;

-- ============================================================
-- Politiques RLS — modération a posteriori (cf. spec §11)
-- ============================================================

create policy "moment_solidaire_select"
  on public.moment_solidaire for select
  using (
    statut in ('annonce', 'en_cours', 'termine', 'annule')
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('moments')
  );

-- Insertion : auth requise. La règle « organiser = membre de la
-- commune territoriale » est appliquée côté Server Action (vérifier
-- est_membre_commune) car la RLS ne peut pas facilement vérifier le
-- commune_id qui arrive en NEW.
create policy "moment_solidaire_insert"
  on public.moment_solidaire for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

create policy "moment_solidaire_update"
  on public.moment_solidaire for update
  using (
    (createurice_id = auth.uid() and statut not in ('retire', 'termine'))
    or public.est_admin_general()
    or public.est_moderateurice('moments')
  );

-- ============================================================
-- Participation à un moment (réutilise le pattern mobilisation 3.2)
-- ============================================================

create table public.participation_moment (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moment_solidaire(id) on delete cascade,
  -- Personne (si connectée) ; null pour les participations anonymes.
  personne_id uuid references public.personne(id) on delete cascade,
  prenom text,
  email text,
  telephone text,
  created_at timestamptz not null default now(),

  -- Une personne connectée ne participe qu'une fois par moment.
  constraint participation_moment_personne_unique
    unique (moment_id, personne_id)
);

comment on table public.participation_moment is
  'Participation à un moment solidaire. Anonyme ou connectée. Cf. spec §7C « pas d''obligation, mais incitation à laisser des coordonnées ».';

create index participation_moment_moment_idx on public.participation_moment (moment_id);
create index participation_moment_personne_idx on public.participation_moment (personne_id)
  where personne_id is not null;

alter table public.participation_moment enable row level security;

create policy "participation_moment_select"
  on public.participation_moment for select
  using (
    public.est_admin_general()
    or public.est_moderateurice('moments')
    or personne_id = auth.uid()
    or exists (
      select 1 from public.moment_solidaire m
      where m.id = moment_id and m.createurice_id = auth.uid()
    )
  );

create policy "participation_moment_insert"
  on public.participation_moment for insert
  with check (true);

-- ============================================================
-- Tupperwares à ramener (variante porte-à-porte, cf. spec §7C)
-- ============================================================

create table public.tupperware (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moment_solidaire(id) on delete cascade,
  -- Personne qui a emporté le Tupperware (peut être l'invitée d'une
  -- table, pas nécessairement adhérente).
  porteureuse_prenom text not null,
  porteureuse_email text,
  porteureuse_telephone text,
  -- Description courte (ex : « gratin de pâtes », « tarte aux pommes »).
  contenu text,
  emporte_le timestamptz not null default now(),
  rendu_le timestamptz,
  statut text not null default 'emporte',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tupperware_statut_valide
    check (statut in ('emporte', 'rendu', 'perdu')),
  constraint tupperware_rendu_coherent
    check (
      (statut = 'rendu' and rendu_le is not null)
      or statut <> 'rendu'
    )
);

comment on table public.tupperware is
  'Tracker Tupperware à ramener (boucle d''engagement par dette légère, cf. spec §7C).';

create index tupperware_moment_idx on public.tupperware (moment_id);
create index tupperware_statut_idx on public.tupperware (statut);

create trigger tupperware_updated_at
  before update on public.tupperware
  for each row
  execute function public.tg_set_updated_at();

alter table public.tupperware enable row level security;

-- Lecture : l'organisateurice du moment + admin. Les Tupperwares
-- contiennent des coordonnées personnelles, on ne les expose pas
-- publiquement.
create policy "tupperware_select"
  on public.tupperware for select
  using (
    exists (
      select 1 from public.moment_solidaire m
      where m.id = moment_id and m.createurice_id = auth.uid()
    )
    or public.est_admin_general()
    or public.est_moderateurice('moments')
  );

create policy "tupperware_insert"
  on public.tupperware for insert
  with check (
    exists (
      select 1 from public.moment_solidaire m
      where m.id = moment_id and m.createurice_id = auth.uid()
    )
    or public.est_admin_general()
  );

create policy "tupperware_update"
  on public.tupperware for update
  using (
    exists (
      select 1 from public.moment_solidaire m
      where m.id = moment_id and m.createurice_id = auth.uid()
    )
    or public.est_admin_general()
  );

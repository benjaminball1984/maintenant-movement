-- Migration 025 : table `minimarche_solidaire` (chantier 4.3 — onglet 3).
--
-- Cf. spec §6F « Marché solidaire » :
--   « 3. Minimarché solidaire (conseils pour organiser un marché physique). »
--   « Lieu physique, géolocalisé sur la carte unifiée. »
--   « 4 monnaies acceptées : T99CP, Euros, Ğ1 (Jaune, monnaie libre
--     Duniter), Monnaies locales complémentaires. »
--   « Préfigure le Comptoir de Change (chantier annexe T99CP). »
--
-- Un minimarché est un événement physique. Pas un produit. Pas une
-- boutique. Une page d'organisation collective, avec date, lieu, des
-- conseils pratiques, et la liste des 4 monnaies acceptées par les
-- exposant·es ce jour-là.

create table public.minimarche_solidaire (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  description text not null,
  image_url text,

  -- Lieu physique obligatoire (carte unifiée).
  lieu text not null,
  latitude double precision,
  longitude double precision,

  -- Date du minimarché. Plage `commence_le` / `termine_le` parce que
  -- certains s'étalent sur 2 jours (week-end).
  commence_le timestamptz not null,
  termine_le timestamptz not null,

  -- Monnaies acceptées sur ce minimarché.
  -- Cf. spec §6F : T99CP, Euros, Ğ1, Monnaies locales complémentaires.
  -- Tableau de slugs pour rester extensible. Au moins une monnaie.
  monnaies_acceptees text[] not null default array['T99CP', 'EUR']::text[],

  -- Provenance
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- État : annonce | en_cours | termine | annule | retire.
  statut text not null default 'annonce',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint minimarche_statut_valide
    check (statut in ('annonce', 'en_cours', 'termine', 'annule', 'retire')),
  constraint minimarche_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint minimarche_lat_valide
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint minimarche_lng_valide
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint minimarche_geo_coherent
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    ),
  constraint minimarche_dates_coherentes
    check (commence_le <= termine_le),
  constraint minimarche_au_moins_une_monnaie
    check (array_length(monnaies_acceptees, 1) >= 1),
  -- Les monnaies doivent être dans le catalogue spec §6F.
  -- Ğ1 et MNLC réservées au physique (cf. spec « Pas de Ğ1 ni monnaies
  -- locales en ligne »). Ici on est physique donc les 4 sont autorisées.
  constraint minimarche_monnaies_valides
    check (
      monnaies_acceptees <@ array['T99CP', 'EUR', 'G1', 'MNLC']::text[]
    )
);

comment on table public.minimarche_solidaire is
  'Minimarché solidaire physique (préfigure le Comptoir de Change T99CP). Carte unifiée.';
comment on column public.minimarche_solidaire.monnaies_acceptees is
  'Sous-ensemble de {T99CP, EUR, G1, MNLC}. Cf. spec §6F : 4 monnaies acceptées en physique.';

create index minimarche_statut_idx on public.minimarche_solidaire (statut, commence_le);
create index minimarche_a_venir_idx on public.minimarche_solidaire (commence_le)
  where statut in ('annonce', 'en_cours');
create index minimarche_createurice_idx on public.minimarche_solidaire (createurice_id);
create index minimarche_geo_idx on public.minimarche_solidaire (latitude, longitude)
  where statut in ('annonce', 'en_cours') and latitude is not null;

create trigger minimarche_solidaire_updated_at
  before update on public.minimarche_solidaire
  for each row
  execute function public.tg_set_updated_at();

alter table public.minimarche_solidaire enable row level security;

create policy "minimarche_select"
  on public.minimarche_solidaire for select
  using (
    statut in ('annonce', 'en_cours', 'termine', 'annule')
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('marche')
  );

create policy "minimarche_insert"
  on public.minimarche_solidaire for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

create policy "minimarche_update"
  on public.minimarche_solidaire for update
  using (
    (createurice_id = auth.uid() and statut not in ('retire', 'termine'))
    or public.est_admin_general()
    or public.est_moderateurice('marche')
  );

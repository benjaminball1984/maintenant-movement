-- Tables `location_mutualisee` + `engagement_location_mutualisee`
-- (cycle V2 §12, chantier V2.3.3).
--
-- Mécanisme transversal distinct du covoiturage/hébergement classiques :
-- un organisateur engage la location d'un bien collectif (bus, car,
-- minibus, salle, lieu) auprès d'un prestataire externe ; met le prix ;
-- les participants paient leur part ; départ/validation quand rempli.
--
-- ⚠️ JURIDIQUE : l'organisateur fait « tampon » (collecte pour payer un
-- tiers) → responsabilité réelle. L'avertissement est OBLIGATOIRE et
-- accepté côté applicatif AVANT création (champ
-- `avertissement_juridique_accepte` = true imposé par CHECK).
--
-- EUROS EXCLUSIVEMENT (§12) : 99-coin non convertible en fiat → l'organisateur
-- serait piégé. CHECK sur `canal = 'euro'`.
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit.

-- ============================================================
-- 1. Table `location_mutualisee`
-- ============================================================
create table if not exists public.location_mutualisee (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' and length(slug) between 3 and 80),

  organisateur_personne_id uuid not null
    references public.personne(id) on delete restrict,

  -- Type de location. Liste fermée extensible (D13).
  type_location text not null check (type_location in (
    'transport_bus',
    'transport_car',
    'transport_minibus',
    'hebergement_salle',
    'hebergement_lieu',
    'autre'
  )),

  titre text not null check (length(titre) between 3 and 200),
  description text not null check (length(description) between 10 and 5000),

  -- Prestataire externe (nom + références libres : société, association,
  -- propriétaire, etc.). Le RIB / IBAN ne va PAS ici (saisi côté Server
  -- Action de paiement, jamais stocké en clair).
  prestataire text not null check (length(prestataire) between 2 and 500),

  -- Lieu de départ / d'événement (libre).
  lieu text not null check (length(lieu) between 2 and 200),

  -- Dates. `date_evenement` = jour J du départ / de la location ;
  -- `date_limite_engagement` = deadline pour s'inscrire (avant cette date,
  -- la collecte est ouverte ; après, on bloque et on valide ou on annule).
  date_evenement timestamptz not null,
  date_limite_engagement timestamptz not null,
  constraint location_dates_coherentes
    check (date_limite_engagement <= date_evenement),

  -- Économie. Montants en CENTIMES d'euros pour la précision comptable
  -- (convention Stripe). Les parts sont entières.
  montant_total_centimes int not null check (montant_total_centimes > 0),
  nb_parts_max int not null check (nb_parts_max > 0 and nb_parts_max <= 1000),
  prix_par_part_centimes int not null check (prix_par_part_centimes > 0),

  -- Canal : EUROS UNIQUEMENT (§12). Forcé par CHECK pour qu'aucun
  -- développement futur ne puisse y mettre du 99-coin par erreur.
  canal text not null default 'euro' check (canal = 'euro'),

  -- Statut. Liste fermée :
  -- - `collecte_en_cours` : par défaut, les engagements sont ouverts.
  -- - `validee` : l'organisateur a confirmé (suffisamment de parts engagées),
  --   l'événement aura lieu.
  -- - `annulee` : pas assez de parts à la deadline, ou annulation manuelle.
  -- - `realisee` : l'événement a eu lieu, clôture.
  statut text not null default 'collecte_en_cours' check (statut in (
    'collecte_en_cours', 'validee', 'annulee', 'realisee'
  )),

  -- Image de couverture (optionnelle).
  image_url text,

  -- ⚠️ Acceptation OBLIGATOIRE par l'organisateur de l'avertissement
  -- juridique (tampon, responsabilité réelle, fiscalité éventuelle).
  -- Posé par la Server Action après affichage de l'avertissement.
  avertissement_juridique_accepte boolean not null
    check (avertissement_juridique_accepte = true),
  avertissement_accepte_le timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.location_mutualisee is
  'Location mutualisée V2 §12 : bus/car/salle/lieu. Euros only. Organisateur fait tampon (avertissement juridique obligatoire).';
comment on column public.location_mutualisee.avertissement_juridique_accepte is
  'Doit être true à l''insertion (CHECK SQL). Garantit que l''organisateur a vu et accepté l''avertissement de responsabilité.';

create index if not exists location_mutualisee_statut_idx
  on public.location_mutualisee(statut, date_evenement);

create index if not exists location_mutualisee_organisateur_idx
  on public.location_mutualisee(organisateur_personne_id);

create index if not exists location_mutualisee_type_idx
  on public.location_mutualisee(type_location, statut);

-- ============================================================
-- 2. Table `engagement_location_mutualisee`
-- ============================================================
create table if not exists public.engagement_location_mutualisee (
  id uuid primary key default gen_random_uuid(),

  location_id uuid not null
    references public.location_mutualisee(id) on delete cascade,

  participant_personne_id uuid not null
    references public.personne(id) on delete cascade,

  -- Nombre de parts engagées (1 minimum, plafond par la capacité totale).
  nb_parts int not null check (nb_parts >= 1 and nb_parts <= 100),

  -- Montant total engagé (centimes). Doit correspondre à nb_parts ×
  -- prix_par_part_centimes de la location parente. Vérification applicative.
  montant_engage_centimes int not null check (montant_engage_centimes > 0),

  -- Statut. `engage` = inscrit, pas encore payé. `paye` = paiement Stripe
  -- confirmé. `annule` = soft delete pour rollback ou retrait avant
  -- paiement.
  statut text not null default 'engage' check (statut in (
    'engage', 'paye', 'annule'
  )),

  -- Lien vers la transaction Stripe (PaymentIntent id côté Stripe).
  -- Nullable tant que le paiement n'a pas eu lieu.
  stripe_payment_intent_id text,

  engage_le timestamptz not null default now(),
  paye_le timestamptz,
  annule_le timestamptz,

  -- Cohérence : paye_le rempli ⇔ statut paye ; annule_le ⇔ annule.
  constraint engagement_statut_dates_coherentes
    check (
      (statut = 'engage' and paye_le is null and annule_le is null)
      or (statut = 'paye' and paye_le is not null and annule_le is null)
      or (statut = 'annule' and annule_le is not null)
    )
);

comment on table public.engagement_location_mutualisee is
  'Engagement d''une personne sur une location mutualisée. Soft delete via statut=annule.';

-- Un seul engagement ACTIF (non annulé) par (location, participant).
create unique index if not exists engagement_location_unique_actif
  on public.engagement_location_mutualisee(location_id, participant_personne_id)
  where statut != 'annule';

create index if not exists engagement_location_par_location_idx
  on public.engagement_location_mutualisee(location_id, statut);

create index if not exists engagement_location_par_participant_idx
  on public.engagement_location_mutualisee(participant_personne_id, statut);

-- ============================================================
-- 3. Triggers updated_at
-- ============================================================
create or replace function public.location_mutualisee_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists location_mutualisee_updated_at_trigger on public.location_mutualisee;
create trigger location_mutualisee_updated_at_trigger
  before update on public.location_mutualisee
  for each row execute function public.location_mutualisee_set_updated_at();

-- ============================================================
-- 4. RLS
-- ============================================================
alter table public.location_mutualisee enable row level security;
alter table public.engagement_location_mutualisee enable row level security;

-- Lecture publique des locations actives (collecte_en_cours / validee /
-- realisee) : les gens doivent pouvoir s'inscrire. Annulées seulement
-- pour organisateur + admin.
drop policy if exists "location_mutualisee_select" on public.location_mutualisee;
create policy "location_mutualisee_select"
  on public.location_mutualisee
  for select
  using (
    statut in ('collecte_en_cours', 'validee', 'realisee')
    or organisateur_personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('autres-moyens')
  );

-- Insertion : tout authentifié peut organiser une location. Le créateur
-- doit être l'organisateur (cohérent avec le tampon juridique).
drop policy if exists "location_mutualisee_insert_organisateur" on public.location_mutualisee;
create policy "location_mutualisee_insert_organisateur"
  on public.location_mutualisee
  for insert
  with check (
    auth.uid() is not null
    and organisateur_personne_id = auth.uid()
    and statut = 'collecte_en_cours'
    and avertissement_juridique_accepte = true
  );

-- Mise à jour : l'organisateur peut valider/annuler/marquer réalisée.
drop policy if exists "location_mutualisee_update_organisateur" on public.location_mutualisee;
create policy "location_mutualisee_update_organisateur"
  on public.location_mutualisee
  for update
  using (
    organisateur_personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('autres-moyens')
  );

drop policy if exists "location_mutualisee_delete_admin" on public.location_mutualisee;
create policy "location_mutualisee_delete_admin"
  on public.location_mutualisee
  for delete
  using (public.est_admin_general());

-- Engagements : visibles par le participant, l'organisateur de la
-- location concernée, et les admins.
drop policy if exists "engagement_location_select" on public.engagement_location_mutualisee;
create policy "engagement_location_select"
  on public.engagement_location_mutualisee
  for select
  using (
    participant_personne_id = auth.uid()
    or exists (
      select 1 from public.location_mutualisee l
      where l.id = engagement_location_mutualisee.location_id
        and l.organisateur_personne_id = auth.uid()
    )
    or public.est_admin_general()
    or public.est_moderateurice('autres-moyens')
  );

-- Insertion : le participant s'engage lui-même.
drop policy if exists "engagement_location_insert_self" on public.engagement_location_mutualisee;
create policy "engagement_location_insert_self"
  on public.engagement_location_mutualisee
  for insert
  with check (
    auth.uid() is not null
    and participant_personne_id = auth.uid()
    and statut = 'engage'
  );

-- Mise à jour : le participant peut annuler son propre engagement.
-- L'organisateur peut marquer paye après confirmation Stripe (via Server
-- Action service_role en pratique, mais on couvre les deux).
drop policy if exists "engagement_location_update_self_ou_organisateur" on public.engagement_location_mutualisee;
create policy "engagement_location_update_self_ou_organisateur"
  on public.engagement_location_mutualisee
  for update
  using (
    participant_personne_id = auth.uid()
    or exists (
      select 1 from public.location_mutualisee l
      where l.id = engagement_location_mutualisee.location_id
        and l.organisateur_personne_id = auth.uid()
    )
    or public.est_admin_general()
  );

drop policy if exists "engagement_location_delete_admin" on public.engagement_location_mutualisee;
create policy "engagement_location_delete_admin"
  on public.engagement_location_mutualisee
  for delete
  using (public.est_admin_general());

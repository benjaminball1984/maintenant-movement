-- Table `reservation` : composant réservation réutilisable (cycle V2 D8,
-- chantier V2.2.2).
--
-- Cf. schema-donnees-V2.md D8 : « Réservation (composant réutilisable,
-- façon Airbnb/BlaBlaCar) ; amorcée par un message d'amorce pré-rempli
-- (§14) dans la messagerie interne ; réutilisée par transport (covoit'),
-- hébergement, prêt, location mutualisée. »
--
-- Choix de modélisation V2.2.2 : on pose le SCHÉMA générique. L'intégration
-- profonde dans chaque sous-espace (rattacher une réservation aux offres
-- existantes V1 `offre_entraide`, futures du marché solidaire, etc.) se
-- fait au cas par cas en VAGUE 3. Les FK polymorphes sont gérées par la
-- paire (offre_type, offre_id) plutôt qu'une vraie FK SQL — pattern
-- cohérent avec `fil_groupe_message`.
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit.

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.reservation (
  id uuid primary key default gen_random_uuid(),

  -- Type d'offre concernée. Liste fermée extensible (D13).
  offre_type text not null check (offre_type in (
    'transport_covoiturage',
    'hebergement',
    'pret',
    'service_sel',
    'location_mutualisee',
    'autre'
  )),

  -- Identifiant interne de l'offre (FK polymorphe). On ne pose pas de
  -- contrainte SQL stricte (le type d'offre désigne la table cible) ;
  -- l'intégrité référentielle est portée par la Server Action qui crée
  -- la réservation (vérification de l'existence de l'offre AVANT l'insert).
  offre_id uuid not null,

  -- Personne qui demande la réservation. Compte authentifié obligatoire
  -- (les signataires sans compte ne peuvent pas réserver).
  demandeur_personne_id uuid not null
    references public.personne(id) on delete cascade,

  -- Créneau demandé. `creneau_fin` peut être NULL pour une réservation
  -- ponctuelle (un événement à date unique). La cohérence début ≤ fin
  -- est vérifiée par CHECK.
  creneau_debut timestamptz not null,
  creneau_fin timestamptz,
  constraint reservation_creneau_coherent
    check (creneau_fin is null or creneau_fin >= creneau_debut),

  -- Quantité concernée (nombre de personnes pour covoit/hébergement,
  -- nombre d'objets pour le prêt, etc.). Par défaut 1.
  quantite int not null default 1 check (quantite > 0),

  -- Message d'amorce envoyé au propriétaire de l'offre. Pré-rempli par
  -- le helper TS `genererMessageAmorce` (cf. lib/reservation-amorce.ts),
  -- éditable par la personne avant envoi.
  message_amorce text not null check (length(message_amorce) between 1 and 2000),

  -- Machine à états (cf. D8 V2).
  statut text not null default 'proposee' check (statut in (
    'proposee',
    'acceptee',
    'refusee',
    'realisee',
    'confirmee',
    'annulee',
    'litige'
  )),

  -- Justification de refus / d'annulation / de litige (facultatif mais
  -- recommandé). Trace pour la modération.
  motif_decision text,

  -- Lien vers la transaction éventuelle (régime A direct ou régime B
  -- via Caisse). Posé après création de la réservation, donc nullable.
  -- Pas de FK SQL stricte tant que l'entité `transaction` V2 n'est pas
  -- posée (D7) ; on stocke juste l'id pour le moment.
  transaction_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reservation is
  'Composant réservation transversal V2 D8. Façon Airbnb/BlaBlaCar, réutilisable par transport/hébergement/prêt/SEL.';
comment on column public.reservation.offre_id is
  'FK polymorphe vers la table de l''offre (selon offre_type). Vérifiée par la Server Action, pas par SQL.';
comment on column public.reservation.statut is
  'Machine à états D8 : proposee → acceptee/refusee → realisee → confirmee, ou annulee/litige.';

-- ============================================================
-- Index
-- ============================================================
-- Lecture par offre (« qui a réservé cette offre ? »).
create index if not exists reservation_offre_idx
  on public.reservation (offre_type, offre_id, created_at desc);

-- Lecture par demandeur (« mes réservations »).
create index if not exists reservation_demandeur_idx
  on public.reservation (demandeur_personne_id, created_at desc);

-- Recherche par statut + date (file d'attente du propriétaire).
create index if not exists reservation_statut_idx
  on public.reservation (statut, creneau_debut)
  where statut in ('proposee', 'acceptee');

-- ============================================================
-- Trigger : maintien automatique de `updated_at`
-- ============================================================
create or replace function public.reservation_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reservation_updated_at_trigger on public.reservation;
create trigger reservation_updated_at_trigger
  before update on public.reservation
  for each row
  execute function public.reservation_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.reservation enable row level security;

-- Lecture : demandeur, propriétaire de l'offre (à vérifier côté
-- applicatif car FK polymorphe), admins. La RLS ici filtre seulement
-- demandeur + admin ; les propriétaires d'offre passent par la Server
-- Action qui charge la réservation après vérification.
drop policy if exists "reservation_select_demandeur_admin" on public.reservation;
create policy "reservation_select_demandeur_admin"
  on public.reservation
  for select
  using (
    demandeur_personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('autres-moyens')
  );

-- Insertion : seuls les comptes authentifiés peuvent créer une réservation.
-- La vérification que l'offre existe + n'est pas la sienne se fait dans la
-- Server Action.
drop policy if exists "reservation_insert_self" on public.reservation;
create policy "reservation_insert_self"
  on public.reservation
  for insert
  with check (
    demandeur_personne_id = auth.uid()
    and auth.uid() is not null
  );

-- Mise à jour : le demandeur peut annuler (statut → annulee) ;
-- les transitions d'état avancées (acceptee/refusee/realisee/confirmee)
-- sont gérées par la Server Action côté propriétaire de l'offre, qui
-- contourne la RLS via le service_role après vérification applicative.
drop policy if exists "reservation_update_demandeur" on public.reservation;
create policy "reservation_update_demandeur"
  on public.reservation
  for update
  using (demandeur_personne_id = auth.uid())
  with check (demandeur_personne_id = auth.uid());

-- Modération : admins peuvent tout, y compris les transitions et les
-- résolutions de litige.
drop policy if exists "reservation_update_admin" on public.reservation;
create policy "reservation_update_admin"
  on public.reservation
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

-- Suppression : interdite côté policy. Une réservation annulée garde sa
-- trace ; seuls les admins peuvent purger en cas d'absolue nécessité.
drop policy if exists "reservation_delete_admin" on public.reservation;
create policy "reservation_delete_admin"
  on public.reservation
  for delete
  using (public.est_admin_general());

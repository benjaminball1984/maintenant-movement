-- Table `transaction_entrante` : entrées d'argent dans une caisse
-- (cycle V2 V2.3.26, complète D7/D12).
--
-- Schéma-données V2 D7 : « régime B (collecte vers le mouvement) =
-- l'argent arrive bien à Maintenant!, dans une Caisse dédiée. » Le
-- chantier V2.2.3 a posé `caisse`, `receptacle_caisse`,
-- `transaction_sortante`. Manquait la symétrie côté entrées : pour
-- pouvoir calculer un solde et tracer la provenance.
--
-- Greffe additive : aucune table V1 touchée. Le branchement automatique
-- des flux V1 (don/adhésion/cagnotte → poser une entrée) sera un
-- chantier dédié (V2.3.27+), une fois cette table en place.
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit.

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.transaction_entrante (
  id uuid primary key default gen_random_uuid(),

  -- Caisse cible.
  caisse_id uuid not null references public.caisse(id) on delete restrict,

  -- Réceptacle utilisé (figé pour traçabilité, comme `transaction_sortante`).
  -- Nullable : certaines entrées peuvent être posées hors flux Stripe/wallet
  -- (régularisation comptable, transfert interne…).
  receptacle_id uuid references public.receptacle_caisse(id) on delete restrict,

  -- Type de source. Liste fermée extensible (D13). Pointeur logique vers
  -- la table métier V1 qui a généré l'entrée (don, adhésion, cagnotte,
  -- cotisation solidaire) ou source manuelle.
  source_type text not null check (source_type in (
    'don',
    'adhesion',
    'cagnotte',
    'cotisation_solidaire',
    'autre',
    'regularisation_manuelle'
  )),

  -- Identifiant de la source (ex. UUID du `don` V1 qui a généré l'entrée).
  -- Nullable pour `regularisation_manuelle`.
  source_id uuid,

  -- Montant et canal de l'entrée.
  montant numeric(14, 2) not null check (montant > 0),
  canal text not null check (canal in ('euro', '99_coin')),

  -- Statut de l'entrée (parallèle à transaction_sortante).
  statut text not null default 'confirmee' check (statut in (
    'initiee', 'confirmee', 'remboursee', 'annulee'
  )),

  -- Motif / contexte court.
  motif text check (motif is null or length(motif) <= 500),

  -- Identité de la personne ayant payé. Compte authentifié quand dispo,
  -- sinon coordonnées externes (donateur anonyme, sympathisant·e sans compte).
  payeur_personne_id uuid references public.personne(id) on delete set null,
  payeur_externe_nom text,
  payeur_externe_email text,

  -- Métadonnées libres (id Stripe charge, txhash Polygon, etc.).
  metadata jsonb not null default '{}'::jsonb,

  recue_le timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Index unique partiel : une `source` (don/adhesion/…) ne peut générer
  -- qu'une seule entrée active (anti-doublon en cas de retry du flux V1).
  -- On laisse l'insertion `regularisation_manuelle` libre.
  constraint transaction_entrante_source_coherente
    check (source_type = 'regularisation_manuelle' or source_id is not null)
);

comment on table public.transaction_entrante is
  'Entrées de caisse (V2.3.26). Symétrie de transaction_sortante. La source pointe vers la table métier V1 qui a généré l''entrée.';

-- ============================================================
-- Index
-- ============================================================
create index if not exists transaction_entrante_caisse_idx
  on public.transaction_entrante (caisse_id, recue_le desc);

create index if not exists transaction_entrante_source_idx
  on public.transaction_entrante (source_type, source_id);

create index if not exists transaction_entrante_statut_idx
  on public.transaction_entrante (statut, recue_le desc);

-- Anti-doublon : une source (par exemple un `don` V1) ne crée qu'une
-- entrée active (excluant annulee/remboursee).
create unique index if not exists transaction_entrante_source_active
  on public.transaction_entrante (source_type, source_id)
  where source_type != 'regularisation_manuelle'
    and statut in ('initiee', 'confirmee');

-- Index sur payeur pour les requêtes « mes contributions ».
create index if not exists transaction_entrante_payeur_idx
  on public.transaction_entrante (payeur_personne_id)
  where payeur_personne_id is not null;

-- ============================================================
-- Trigger updated_at
-- ============================================================
create or replace function public.transaction_entrante_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists transaction_entrante_updated_at on public.transaction_entrante;
create trigger transaction_entrante_updated_at
  before update on public.transaction_entrante
  for each row execute function public.transaction_entrante_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.transaction_entrante enable row level security;

-- Lecture : admin national + payeur (sa propre contribution).
drop policy if exists "transaction_entrante_select_admin_payeur" on public.transaction_entrante;
create policy "transaction_entrante_select_admin_payeur"
  on public.transaction_entrante
  for select
  using (
    public.est_admin_general()
    or (payeur_personne_id is not null and payeur_personne_id = auth.uid())
  );

-- Insertion : interdite côté client. Seules les Server Actions via
-- service_role peuvent insérer (cohérent avec les autres tables V2.2.3+).
drop policy if exists "transaction_entrante_insert_blocked" on public.transaction_entrante;
create policy "transaction_entrante_insert_blocked"
  on public.transaction_entrante
  for insert
  with check (false);

-- Mise à jour : admin national uniquement (remboursement/annulation).
drop policy if exists "transaction_entrante_update_admin" on public.transaction_entrante;
create policy "transaction_entrante_update_admin"
  on public.transaction_entrante
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

-- Pas de DELETE côté policy (audit conservé).

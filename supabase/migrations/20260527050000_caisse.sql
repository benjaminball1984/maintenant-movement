-- Tables `caisse` + `receptacle_caisse` + `transaction_sortante`
-- (cycle V2 D7 + D12 + D12bis, chantier V2.2.3).
--
-- Cf. schema-donnees-V2.md :
--   - D7 : régime B (collecte vers le mouvement) = l'argent arrive bien à
--     Maintenant!, dans une Caisse dédiée. Une caisse par TYPE de
--     contribution (adhésion, cotisation, dons généraux) + une caisse
--     par cagnotte solidaire.
--   - D7 (Réceptacles AVEC HISTORIQUE DATÉ) : table fille `ReceptacleCaisse`
--     = (caisse_id, canal, identifiant_receptacle, valide_du, valide_au).
--   - D12 : reversement = plusieurs Transaction sortantes possibles
--     (sorties multiples assumées + plusieurs bénéficiaires).
--   - D12bis : **justificatif OBLIGATOIRE** pour toute sortie. Rigueur
--     maximale assumée sur l'argent solidaire.
--
-- Greffe additive : aucune table V1 touchée (`don`, `cagnotte`, `adhesion`
-- restent intactes). La logique applicative qui consomme/reverse via les
-- Caisses sera branchée dans des chantiers V2 ultérieurs (Server Actions
-- côté trésorerie + UI admin).
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit.

-- ============================================================
-- 1. Table `caisse`
-- ============================================================
create table if not exists public.caisse (
  id uuid primary key default gen_random_uuid(),

  -- Type de caisse. Liste fermée extensible (D13). « cagnotte » ouvre la
  -- caisse d'une cagnotte solidaire particulière (objet_id renseigné).
  -- Les autres types pointent vers des caisses globales du mouvement.
  type_caisse text not null check (type_caisse in (
    'adhesion',
    'cotisation_solidaire',
    'don_general',
    'cagnotte',
    'autre'
  )),

  -- Libellé humain (« Adhésions 2026 », « Cagnotte Famille Dupont »…).
  libelle text not null check (length(libelle) between 1 and 200),

  -- Objet métier rattaché (nullable). Pour une caisse de cagnotte, c'est
  -- l'UUID de la `cagnotte` correspondante. Pour les autres types, NULL.
  objet_type text check (objet_type is null or objet_type in (
    'cagnotte', 'adhesion', 'campagne'
  )),
  objet_id uuid,

  -- Statut administratif. `ouverte` = la caisse accepte des entrées et peut
  -- faire des sorties. `fermee` = plus d'entrées ni de sorties (clôture
  -- comptable). `suspendue` = pause temporaire (modération, litige).
  statut text not null default 'ouverte' check (statut in (
    'ouverte', 'suspendue', 'fermee'
  )),

  -- Métadonnées libres : seuils, plafonds, contexte.
  metadata jsonb not null default '{}'::jsonb,

  ouverte_le timestamptz not null default now(),
  fermee_le timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Cohérence : si `objet_id` est renseigné, `objet_type` aussi.
  constraint caisse_objet_coherent
    check ((objet_type is null and objet_id is null) or (objet_type is not null and objet_id is not null)),

  -- Une caisse de cagnotte est unique pour une cagnotte donnée (1-1).
  constraint caisse_unicite_cagnotte
    check (type_caisse != 'cagnotte' or objet_type = 'cagnotte')
);

comment on table public.caisse is
  'Caisse régime B V2 (D7). Une par type de contribution + une par cagnotte solidaire.';
comment on column public.caisse.objet_id is
  'FK polymorphe vers l''objet rattaché (cagnotte, adhésion, etc.). NULL pour les caisses globales.';

-- Une seule caisse cagnotte active par cagnotte (index unique partiel).
create unique index if not exists caisse_unique_par_cagnotte
  on public.caisse (objet_id)
  where type_caisse = 'cagnotte' and statut != 'fermee';

create index if not exists caisse_type_statut_idx
  on public.caisse (type_caisse, statut);

create index if not exists caisse_objet_idx
  on public.caisse (objet_type, objet_id)
  where objet_id is not null;

-- ============================================================
-- 2. Table `receptacle_caisse`
-- ============================================================
-- Réceptacles AVEC HISTORIQUE DATÉ (D7 option la plus prudente, retenue).
-- Permet de dire avec certitude vers quel compte/wallet est parti chaque
-- versement à chaque période. Indispensable pour la bascule
-- « Stripe général → Stripe association » et pour un contrôle/bilan.
create table if not exists public.receptacle_caisse (
  id uuid primary key default gen_random_uuid(),
  caisse_id uuid not null references public.caisse(id) on delete cascade,

  -- Canal du réceptacle. Liste fermée.
  canal text not null check (canal in ('euro', '99_coin')),

  -- Identifiant du réceptacle :
  -- - canal=euro : id compte Stripe Connect ou IBAN de référence.
  -- - canal=99_coin : adresse de wallet Polygon (0x...).
  identifiant_receptacle text not null check (length(identifiant_receptacle) > 0),

  -- Métadonnées : ex. type de compte Stripe, propriétaire du wallet, etc.
  metadata jsonb not null default '{}'::jsonb,

  -- Période de validité du réceptacle. `valide_au` NULL = réceptacle
  -- courant (pas encore remplacé).
  valide_du timestamptz not null default now(),
  valide_au timestamptz,

  created_at timestamptz not null default now(),

  constraint receptacle_periode_coherente
    check (valide_au is null or valide_au >= valide_du)
);

comment on table public.receptacle_caisse is
  'Réceptacles datés par caisse + canal (D7). Permet de tracer le compte Stripe / wallet utilisé à chaque période.';

-- Pour une caisse + un canal, un seul réceptacle « courant » (valide_au NULL).
create unique index if not exists receptacle_unique_courant
  on public.receptacle_caisse (caisse_id, canal)
  where valide_au is null;

create index if not exists receptacle_caisse_idx
  on public.receptacle_caisse (caisse_id, valide_du desc);

-- ============================================================
-- 3. Table `transaction_sortante`
-- ============================================================
-- Reversement d'une caisse vers un bénéficiaire (D12). Justificatif
-- OBLIGATOIRE (D12bis : aucune sortie n'est validée sans pièce attachée).
create table if not exists public.transaction_sortante (
  id uuid primary key default gen_random_uuid(),

  -- Caisse source.
  caisse_id uuid not null references public.caisse(id) on delete restrict,

  -- Réceptacle utilisé au moment de l'opération (FK historique, pas le
  -- réceptacle courant — on fige le réceptacle au moment du reversement
  -- pour traçabilité).
  receptacle_id uuid not null references public.receptacle_caisse(id) on delete restrict,

  -- Bénéficiaire final. Compte authentifié si la personne a un profil,
  -- nullable si bénéficiaire externe identifié par les `coordonnees_externes`.
  beneficiaire_personne_id uuid references public.personne(id) on delete set null,

  -- Si le bénéficiaire est externe (organisation tierce, famille hors
  -- plateforme), on stocke ses coordonnées légales pour le justificatif.
  beneficiaire_externe_nom text,
  beneficiaire_externe_iban_ou_wallet text,

  -- Montant et canal du reversement.
  montant numeric(14, 2) not null check (montant > 0),
  canal text not null check (canal in ('euro', '99_coin')),

  -- Statut de la transaction.
  statut text not null default 'initiee' check (statut in (
    'initiee', 'confirmee', 'annulee', 'litige'
  )),

  -- Motif / contexte.
  motif text not null check (length(motif) between 5 and 1000),

  -- ⚠️ JUSTIFICATIF OBLIGATOIRE (D12bis). On stocke le chemin Supabase
  -- Storage (cohérent avec V2.0.3 IMAGE_STORAGE_PROVIDER, mais pour des
  -- documents) + une URL signée temporaire en cache si besoin. Un trigger
  -- CHECK refuse l'insertion sans `justificatif_storage_path`.
  justificatif_storage_path text not null check (length(justificatif_storage_path) > 0),
  justificatif_nom_original text not null,
  justificatif_mime_type text not null check (justificatif_mime_type in (
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp'
  )),

  -- Traçabilité.
  initie_par_personne_id uuid not null references public.personne(id),
  initie_le timestamptz not null default now(),
  confirme_par_personne_id uuid references public.personne(id),
  confirme_le timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Cohérence : au moins une identité de bénéficiaire (interne OU externe).
  constraint transaction_sortante_beneficiaire_present
    check (
      beneficiaire_personne_id is not null
      or (beneficiaire_externe_nom is not null and length(beneficiaire_externe_nom) > 0)
    )
);

comment on table public.transaction_sortante is
  'Reversement caisse → bénéficiaire (D12). Justificatif OBLIGATOIRE (D12bis).';
comment on column public.transaction_sortante.justificatif_storage_path is
  'Chemin Supabase Storage du justificatif (PDF / image). Refus d''insertion si vide.';

create index if not exists transaction_sortante_caisse_idx
  on public.transaction_sortante (caisse_id, initie_le desc);

create index if not exists transaction_sortante_beneficiaire_idx
  on public.transaction_sortante (beneficiaire_personne_id)
  where beneficiaire_personne_id is not null;

create index if not exists transaction_sortante_statut_idx
  on public.transaction_sortante (statut, initie_le desc);

-- ============================================================
-- Triggers : maintien automatique de `updated_at`
-- ============================================================
create or replace function public.caisse_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists caisse_updated_at_trigger on public.caisse;
create trigger caisse_updated_at_trigger
  before update on public.caisse
  for each row execute function public.caisse_set_updated_at();

drop trigger if exists transaction_sortante_updated_at_trigger on public.transaction_sortante;
create trigger transaction_sortante_updated_at_trigger
  before update on public.transaction_sortante
  for each row execute function public.caisse_set_updated_at();

-- ============================================================
-- RLS — Caisse + Réceptacle + Transaction sortante
-- ============================================================
-- Lecture : trésorier·ière (`tresorerie` en V1, `gerer_caisse` en V2),
-- admin général, DPD (audit). Pas de lecture publique des données
-- financières internes au mouvement.

alter table public.caisse enable row level security;
alter table public.receptacle_caisse enable row level security;
alter table public.transaction_sortante enable row level security;

-- Helper inline : a-t-on un droit V1 `tresorerie` actif ?
create or replace function public.est_tresorierice()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.droit_admin
    where personne_id = auth.uid()
      and niveau = 'tresorerie'
      and retire_le is null
  );
$$;

comment on function public.est_tresorierice() is
  'True si la personne a un droit V1 tresorerie actif. Helper inline pour les policies caisse/transaction_sortante.';

-- Caisse : lecture admin/trésorier/DPD ; écriture admin/trésorier.
drop policy if exists "caisse_select_tresorerie" on public.caisse;
create policy "caisse_select_tresorerie"
  on public.caisse for select
  using (public.est_admin_general() or public.est_tresorierice() or public.est_dpd());

drop policy if exists "caisse_write_tresorerie" on public.caisse;
create policy "caisse_write_tresorerie"
  on public.caisse for all
  using (public.est_admin_general() or public.est_tresorierice())
  with check (public.est_admin_general() or public.est_tresorierice());

-- Réceptacle : idem.
drop policy if exists "receptacle_select_tresorerie" on public.receptacle_caisse;
create policy "receptacle_select_tresorerie"
  on public.receptacle_caisse for select
  using (public.est_admin_general() or public.est_tresorierice() or public.est_dpd());

drop policy if exists "receptacle_write_tresorerie" on public.receptacle_caisse;
create policy "receptacle_write_tresorerie"
  on public.receptacle_caisse for all
  using (public.est_admin_general() or public.est_tresorierice())
  with check (public.est_admin_general() or public.est_tresorierice());

-- Transaction sortante : lecture admin/trésorier/DPD ; écriture
-- admin/trésorier ; bénéficiaire peut lire SA transaction.
drop policy if exists "transaction_sortante_select" on public.transaction_sortante;
create policy "transaction_sortante_select"
  on public.transaction_sortante for select
  using (
    public.est_admin_general()
    or public.est_tresorierice()
    or public.est_dpd()
    or beneficiaire_personne_id = auth.uid()
  );

drop policy if exists "transaction_sortante_write_tresorerie" on public.transaction_sortante;
create policy "transaction_sortante_write_tresorerie"
  on public.transaction_sortante for all
  using (public.est_admin_general() or public.est_tresorierice())
  with check (public.est_admin_general() or public.est_tresorierice());

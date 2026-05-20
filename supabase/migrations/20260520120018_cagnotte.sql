-- Migration 018 : table `cagnotte`.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §5D et docs/specs/08_PLAN_CHANTIERS.md
-- (chantier 3.3) :
--   - Modération a posteriori + blocage en cas de comportement louche.
--   - 3 sous-types :
--       1. cagnottes ouvertes (projets, personnes, causes)
--       2. caisses de lutte et de grève
--       3. cotisations (admin only, créées par l'équipe nationale) :
--          sécurité sociale du logement, des mobilités, de l'alimentation,
--          cagnotte cotisation libre RBU.
--   - Versement euros via Stripe Connect + KYC du porteur.
--   - Versement T99CP via wallet.
--   - Frais : 5 % euros (absorbés par la personne donatrice), 0 % T99CP.
--
-- Architecture : pour 3.3 v1, on stocke l'objectif et le porteur, on
-- expose une jauge unifiée €+T99CP, on calcule les agrégats à la
-- demande (vue + fonction SECURITY DEFINER pour le count public).

create table public.cagnotte (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  texte text not null,
  image_url text,

  -- Type (cf. §5D).
  type text not null,

  -- Objectif (en euros ; les T99CP convertis 1:1 abondent la jauge).
  -- 0 = pas d'objectif chiffré (cagnotte « ouverte » sans seuil).
  objectif_euros integer not null default 0,

  -- Porteur·euse (personne qui reçoit les fonds). Pour les cotisations
  -- admin, c'est l'admin national qui porte (Maintenant! mouvement),
  -- pour les autres c'est la personne créatrice avec KYC Stripe Connect.
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- Identifiant Stripe Connect du compte connecté du porteur (rempli
  -- après KYC). Nullable tant que le KYC n'est pas complété : la
  -- cagnotte peut être créée et listée, mais les paiements euros sont
  -- bloqués (mock toléré côté app jusqu'à branchement réel Stripe).
  stripe_account_id text,

  -- Adresse wallet T99CP du porteur (option, sinon don T99CP désactivé).
  wallet_t99cp text,

  -- État opérationnel
  statut text not null default 'publiee',
  suspendue_par uuid references public.personne(id) on delete set null,
  suspendue_le timestamptz,
  raison_suspension text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cagnotte_type_valide
    check (type in ('ouverte', 'lutte', 'cotisation')),
  constraint cagnotte_statut_valide
    check (statut in ('publiee', 'suspendue', 'cloturee')),
  constraint cagnotte_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint cagnotte_objectif_positif
    check (objectif_euros >= 0 and objectif_euros <= 10000000),
  constraint cagnotte_suspension_coherente
    check (
      (statut = 'suspendue' and raison_suspension is not null)
      or statut <> 'suspendue'
    ),
  constraint cagnotte_suspension_meta_coherente
    check (
      (suspendue_par is null and suspendue_le is null)
      or (suspendue_par is not null and suspendue_le is not null)
    )
);

comment on table public.cagnotte is 'Cagnotte solidaire (ouverte | lutte | cotisation). Modération a posteriori, suspension sur signalement.';
comment on column public.cagnotte.type is 'ouverte | lutte | cotisation';
comment on column public.cagnotte.statut is 'publiee | suspendue | cloturee';
comment on column public.cagnotte.objectif_euros is '0 = pas d''objectif chiffré (cagnotte ouverte sans seuil).';

create index cagnotte_statut_idx on public.cagnotte (statut);
create index cagnotte_type_idx on public.cagnotte (type);
create index cagnotte_createurice_idx on public.cagnotte (createurice_id);
create index cagnotte_publiee_recente_idx on public.cagnotte (created_at desc)
  where statut = 'publiee';

create trigger cagnotte_updated_at
  before update on public.cagnotte
  for each row
  execute function public.tg_set_updated_at();

alter table public.cagnotte enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : publiées et suspendues visibles publiquement (la suspension
-- est transparente, on affiche un bandeau « suspendue, raison »). Les
-- cloturées aussi (historique). Modé / admin voient tout par défaut.
create policy "cagnotte_select"
  on public.cagnotte for select
  using (
    statut in ('publiee', 'suspendue', 'cloturee')
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('cagnottes')
  );

-- Création : auth requise. Cas particulier des cotisations : seul un
-- admin national peut créer une cagnotte de type 'cotisation'.
create policy "cagnotte_insert_auth"
  on public.cagnotte for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
    and (
      type <> 'cotisation'
      or public.est_admin_national()
    )
  );

-- Mise à jour : créateurice peut éditer ses propres cagnottes publiées
-- (descriptif, image, objectif), modé/admin tout. Les changements de
-- statut (suspendre / clôturer) passent par la Server Action dédiée.
create policy "cagnotte_update"
  on public.cagnotte for update
  using (
    (createurice_id = auth.uid() and statut = 'publiee')
    or public.est_admin_general()
    or public.est_moderateurice('cagnottes')
  );

-- Pas de DELETE : on suspend ou on clôture, on ne supprime pas
-- (préservation de l'historique financier).

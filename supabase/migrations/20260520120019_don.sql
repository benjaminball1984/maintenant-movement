-- Migration 019 : table `don` + helpers d'agrégat.
--
-- Versement à une cagnotte. Cf. spec §5D :
--   - Euros (Stripe Checkout, frais 5 % absorbés par la donatrice).
--   - T99CP (wallet, frais 0 %).
--
-- Anonyme possible (don sans compte). Si connectée, on lie `personne_id`
-- pour permettre /profil/contributions et les reçus.
--
-- États :
--   en_attente (Stripe Checkout initié, pas encore confirmé)
--     → confirme    (webhook ou confirmation T99CP)
--     → echoue      (annulation, refus de carte, expiration)
--     → rembourse   (demande de remboursement traitée)
--
-- Le **montant_centimes** est la valeur nette qui abonde la cagnotte
-- (en centimes d'€ ou en plus petite unité T99CP, selon `monnaie`).
-- Pour les euros, **frais_centimes** stocke les frais Stripe + frais
-- mouvement (5 %). Pour T99CP, frais_centimes = 0.

create table public.don (
  id uuid primary key default gen_random_uuid(),

  cagnotte_id uuid not null references public.cagnotte(id) on delete restrict,

  -- Personne donatrice (null si don anonyme).
  personne_id uuid references public.personne(id) on delete set null,

  -- Identité saisie au formulaire (pour reçu fiscal éventuel + dédoublonnage
  -- conformément RGPD : on stocke ce qui a été déclaré, pas plus).
  prenom text,
  nom text,
  email text,
  code_postal text,

  -- Monnaie : EUR (paiement carte via Stripe) ou T99CP (wallet).
  monnaie text not null,

  -- Montant net qui abonde la cagnotte, dans la plus petite unité (centimes
  -- d'€ ou 1e-18 T99CP côté wei ; on stocke en bigint pour T99CP, mais ici
  -- on prend des montants raisonnables → bigint = sûr).
  montant_centimes bigint not null,

  -- Frais (Stripe + plateforme) pour les euros. 0 pour T99CP.
  frais_centimes bigint not null default 0,

  -- Métadonnées de transaction.
  -- Pour Stripe : `stripe_payment_intent_id` ; pour T99CP : `tx_hash`.
  stripe_payment_intent_id text,
  tx_hash text,

  -- État de la transaction.
  statut text not null default 'en_attente',

  -- Cases d'opt-in (cf. spec §3 / §10).
  accepte_newsletter boolean not null default false,
  accepte_contact_createurice boolean not null default false,

  created_at timestamptz not null default now(),
  confirme_le timestamptz,

  constraint don_monnaie_valide
    check (monnaie in ('EUR', 'T99CP')),
  constraint don_statut_valide
    check (statut in ('en_attente', 'confirme', 'echoue', 'rembourse')),
  constraint don_montant_positif
    check (montant_centimes > 0),
  constraint don_frais_positif
    check (frais_centimes >= 0),
  -- T99CP : frais doivent être 0 (politique « 0 % T99CP »).
  constraint don_frais_t99cp_zero
    check (monnaie <> 'T99CP' or frais_centimes = 0),
  -- Email format si renseigné.
  constraint don_email_format
    check (email is null or email ~ '^[^@]+@[^@]+\.[^@]+$'),
  -- Code postal format si renseigné.
  constraint don_code_postal_format
    check (code_postal is null or code_postal ~ '^\d{5}$')
);

comment on table public.don is 'Versement à une cagnotte. Anonyme possible. Monnaie EUR (Stripe) ou T99CP (wallet). Frais 5 % EUR / 0 % T99CP.';
comment on column public.don.montant_centimes is 'Montant net abondant la cagnotte (centimes pour EUR, plus petite unité pour T99CP).';

create index don_cagnotte_idx on public.don (cagnotte_id, created_at desc);
create index don_personne_idx on public.don (personne_id) where personne_id is not null;
create index don_statut_idx on public.don (statut);
-- Anti-doublon : un même payment_intent Stripe ne crée qu'une ligne.
create unique index don_stripe_unique
  on public.don (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create unique index don_tx_unique
  on public.don (tx_hash)
  where tx_hash is not null;

alter table public.don enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : un don individuel n'est pas public.
-- - La donatrice connectée voit ses dons.
-- - La porteuse de la cagnotte voit les dons à sa cagnotte (pour
--   remerciements et reçus).
-- - Modé / admin voient tout.
create policy "don_select"
  on public.don for select
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('cagnottes')
    or exists (
      select 1 from public.cagnotte c
      where c.id = don.cagnotte_id and c.createurice_id = auth.uid()
    )
  );

-- Insertion : ouverte (anonyme ou connectée). La Server Action filtre
-- les cagnottes suspendues. Les webhooks Stripe insèrent côté serveur
-- avec service_role (qui bypasse RLS, donc cette policy n'a pas à le
-- gérer).
create policy "don_insert"
  on public.don for insert
  with check (
    personne_id is null
    or personne_id = auth.uid()
  );

-- Update : interdite côté usager·ère. Les webhooks Stripe utilisent
-- service_role. Modé/admin peuvent passer un don en `rembourse` via la
-- Server Action.
create policy "don_update_admin"
  on public.don for update
  using (
    public.est_admin_general()
    or public.est_moderateurice('cagnottes')
  );

-- Pas de DELETE : un don confirmé est immuable (historique financier).

-- ============================================================
-- Vue d'agrégat : compteurs par cagnotte (somme EUR + somme T99CP).
-- Lecture publique parce que la cagnotte est publique : on expose
-- uniquement les totaux, pas les lignes individuelles.
-- ============================================================
create or replace view public.cagnotte_compteur as
  select
    c.id as cagnotte_id,
    c.slug,
    c.objectif_euros,
    coalesce(sum(d.montant_centimes) filter (where d.monnaie = 'EUR' and d.statut = 'confirme'), 0)::bigint
      as total_euros_centimes,
    coalesce(sum(d.montant_centimes) filter (where d.monnaie = 'T99CP' and d.statut = 'confirme'), 0)::bigint
      as total_t99cp_unites,
    count(d.id) filter (where d.statut = 'confirme')::bigint as nombre_dons
  from public.cagnotte c
  left join public.don d on d.cagnotte_id = c.id
  group by c.id, c.slug, c.objectif_euros;

comment on view public.cagnotte_compteur is
  'Agrégats publics d''une cagnotte (totaux EUR + T99CP + nombre de dons confirmés).';

-- ============================================================
-- Fonction SECURITY DEFINER : agrégat d'une cagnotte donnée.
-- ============================================================
create or replace function public.compteurs_cagnotte(cagnotte_a_compter uuid)
returns table (
  total_euros_centimes bigint,
  total_t99cp_unites bigint,
  nombre_dons bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(montant_centimes) filter (where monnaie = 'EUR' and statut = 'confirme'), 0)::bigint
      as total_euros_centimes,
    coalesce(sum(montant_centimes) filter (where monnaie = 'T99CP' and statut = 'confirme'), 0)::bigint
      as total_t99cp_unites,
    count(*) filter (where statut = 'confirme')::bigint as nombre_dons
  from public.don
  where cagnotte_id = cagnotte_a_compter;
$$;

comment on function public.compteurs_cagnotte(uuid) is
  'Compteurs publics d''une cagnotte : total EUR (centimes), total T99CP (unités), nombre de dons confirmés.';

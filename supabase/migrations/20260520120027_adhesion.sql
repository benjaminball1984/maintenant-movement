-- Migration 027 : table `adhesion` (chantier 5.1).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §7A « Adhérer » :
--   « Page sobre, doctrine ouverte. Pas d'argumentaire pesant : on entre
--     dans le mouvement, on en sort, on revient. 3 chemins (gratuit,
--     T99CP, euros). Onboarding contextualisé selon le chemin d'entrée. »
-- Cf. docs/specs/08_PLAN_CHANTIERS.md :
--   « 5.1 Adhérer (3 chemins) : gratuit, 12 €, 12 T99CP + mail de
--     relance J+365. »
--
-- Modèle :
--   - une ligne `adhesion` par adhésion. La personne peut renouveler →
--     plusieurs lignes pour une même personne, c'est la plus récente
--     active qui compte (vue `adherent_actif`).
--   - statut `active` (en cours), `expiree` (au-delà de la date d'expi).
--   - relance_envoyee_le : pour qu'un cron ne renvoie pas plusieurs
--     fois le même mail. Marqué `now()` quand le mail part.

create table public.adhesion (
  id uuid primary key default gen_random_uuid(),

  personne_id uuid not null references public.personne(id) on delete cascade,

  -- Chemin d'entrée — onboarding contextualisé (cf. spec §7A).
  chemin text not null,

  -- Montant payé. Pour `gratuit`, les deux sont à 0.
  -- Pour `euros` : centimes (entier). Convention 12 € = 1200.
  -- Pour `t99cp` : plus petite unité, string bigint-safe. 12 T99CP en
  -- unités = `12000000000000000000` (10^18 par 99-coin).
  montant_euros_centimes integer not null default 0,
  montant_t99cp_unites text not null default '0',

  -- Période couverte. 12 mois par défaut (renouvelable). Stocké de
  -- façon explicite pour permettre des durées différentes plus tard
  -- (1 mois, 2 ans, etc.) sans migration.
  debute_le timestamptz not null default now(),
  expire_le timestamptz not null default (now() + interval '365 days'),

  -- État opérationnel.
  statut text not null default 'active',

  -- Traçabilité paiement (Stripe Checkout ou tx T99CP). null pour les
  -- adhésions gratuites.
  stripe_session_id text,
  tx_hash text,

  -- Relance J+365 : pour suivre les envois de mail et éviter de
  -- spammer plusieurs fois la même personne quand le cron tourne.
  relance_envoyee_le timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint adhesion_chemin_valide
    check (chemin in ('gratuit', 'euros', 't99cp')),
  constraint adhesion_statut_valide
    check (statut in ('active', 'expiree', 'annulee')),
  constraint adhesion_dates_coherentes
    check (debute_le <= expire_le),
  constraint adhesion_montant_eur_positif
    check (montant_euros_centimes >= 0),
  constraint adhesion_montant_t99cp_format
    check (montant_t99cp_unites ~ '^\d+$'),
  -- Cohérence chemin / montant : gratuit → 0 partout ; euros → eur > 0 ;
  -- t99cp → t99cp > '0'.
  constraint adhesion_chemin_montant_coherent
    check (
      (chemin = 'gratuit' and montant_euros_centimes = 0 and montant_t99cp_unites = '0')
      or (chemin = 'euros' and montant_euros_centimes > 0)
      or (chemin = 't99cp' and montant_t99cp_unites <> '0')
    )
);

comment on table public.adhesion is
  'Adhésion à Maintenant! — 3 chemins (gratuit, euros 12 €, T99CP 12 unités). Renouvelable annuellement (mail J+365).';
comment on column public.adhesion.chemin is 'gratuit | euros | t99cp (cf. spec §7A)';
comment on column public.adhesion.relance_envoyee_le is
  'Timestamp d''envoi de la dernière relance J+365. null si pas encore envoyée.';

create index adhesion_personne_idx on public.adhesion (personne_id, debute_le desc);
create index adhesion_active_idx on public.adhesion (statut, expire_le)
  where statut = 'active';
-- Index pour le cron de relance : adhésions actives, qui expirent
-- bientôt, sans relance encore envoyée.
create index adhesion_a_relancer_idx on public.adhesion (expire_le)
  where statut = 'active' and relance_envoyee_le is null;

create trigger adhesion_updated_at
  before update on public.adhesion
  for each row
  execute function public.tg_set_updated_at();

alter table public.adhesion enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : la personne voit ses propres adhésions. Admin national
-- voit tout (trésorerie + indicateurs).
create policy "adhesion_select"
  on public.adhesion for select
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_admin_national()
  );

-- Insertion : auth requise, la personne ne peut adhérer que pour
-- elle-même.
create policy "adhesion_insert"
  on public.adhesion for insert
  with check (
    auth.uid() is not null
    and personne_id = auth.uid()
  );

-- Update : admin national pour passer en `expiree` ou `annulee`,
-- pour marquer `relance_envoyee_le`. La personne elle-même ne touche
-- pas à son adhésion une fois créée (renouvellement = nouvelle ligne).
create policy "adhesion_update"
  on public.adhesion for update
  using (public.est_admin_general() or public.est_admin_national());

-- ============================================================
-- Vue agrégée : qui est adhérent·e actuellement ?
-- Lue par les pages profil + indicateurs publics (chantier 14).
-- ============================================================
create or replace view public.adherent_actif as
select
  a.personne_id,
  a.id as adhesion_id,
  a.chemin,
  a.debute_le,
  a.expire_le,
  a.statut
from public.adhesion a
where a.statut = 'active'
  and a.expire_le > now()
  and a.id = (
    select a2.id
    from public.adhesion a2
    where a2.personne_id = a.personne_id
      and a2.statut = 'active'
      and a2.expire_le > now()
    order by a2.expire_le desc, a2.debute_le desc
    limit 1
  );

comment on view public.adherent_actif is
  'Personnes actuellement adhérentes (dernière adhésion active non expirée). Cf. spec §3 vocabulaire « adhérent·e ».';

grant select on public.adherent_actif to authenticated, anon;

-- ============================================================
-- Fonction : adhésions à relancer (utilisée par cron applicatif).
-- Liste les adhésions qui expirent dans ≤ seuil_jours, statut active,
-- jamais relancées.
-- ============================================================
create or replace function public.adhesions_a_relancer(seuil_jours integer default 0)
returns setof public.adhesion
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.adhesion
  where statut = 'active'
    and relance_envoyee_le is null
    and expire_le <= now() + make_interval(days => seuil_jours);
$$;

comment on function public.adhesions_a_relancer(integer) is
  'Liste les adhésions actives à relancer (J+365). Utilisé par le cron applicatif `envoyerRelancesAdhesion`.';

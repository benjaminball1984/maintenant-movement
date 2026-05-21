-- Migration 022 : table `prestation_sel` + fonction de crédit automatique.
--
-- Cf. spec §6E :
--   « Mécanique : modération à 2 h, 120 minutes = 120 99-coins crédités
--     automatiquement. »
--
-- Représente une exécution concrète d'un service par une personne
-- prestataire pour une personne bénéficiaire. Une fois la prestation
-- déclarée terminée et qu'aucune contestation n'arrive sous 2 h, on
-- crédite automatiquement le wallet T99CP du prestataire.
--
-- Cycle de vie :
--   en_attente   (réservée mais pas encore réalisée)
--     → en_modération  (le prestataire a déclaré « réalisée »)
--     → creditee       (2 h écoulées sans contestation → wallet crédité)
--     → contestee      (la bénéficiaire conteste → modération humaine)
--     → annulee        (l'une des parties annule avant exécution)

create table public.prestation_sel (
  id uuid primary key default gen_random_uuid(),

  service_id uuid not null references public.service_sel(id) on delete restrict,

  -- Personnes impliquées.
  prestataire_id uuid not null references public.personne(id) on delete cascade,
  beneficiaire_id uuid not null references public.personne(id) on delete cascade,

  -- Durée réelle saisie au moment de la déclaration de réalisation
  -- (en minutes). Détermine le crédit T99CP à émettre (1 minute = 1 99-coin).
  duree_minutes_reelle integer,

  -- État
  statut text not null default 'en_attente',

  -- Timeline. `declaree_realisee_le` enclenche le compteur 2 h ; après
  -- ce délai sans contestation, `creditee_le` est rempli (et l'opération
  -- de crédit T99CP est lancée côté app, cf. cron `crediter_prestations`).
  reservee_le timestamptz not null default now(),
  declaree_realisee_le timestamptz,
  creditee_le timestamptz,
  contestee_le timestamptz,
  annulee_le timestamptz,

  -- Trace de la transaction T99CP (tx_hash) une fois le crédit émis.
  tx_hash_credit text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint prestation_statut_valide
    check (statut in ('en_attente', 'en_moderation', 'creditee', 'contestee', 'annulee')),
  constraint prestation_personnes_distinctes
    check (prestataire_id <> beneficiaire_id),
  constraint prestation_duree_positive
    check (duree_minutes_reelle is null or duree_minutes_reelle > 0),
  -- Cohérence : si `creditee`, on doit avoir une durée réelle.
  constraint prestation_credit_coherent
    check (
      statut <> 'creditee'
      or (duree_minutes_reelle is not null and creditee_le is not null)
    )
);

comment on table public.prestation_sel is
  'Exécution d''un service SEL (durée réelle + workflow modération 2 h + crédit T99CP).';

create index prestation_service_idx on public.prestation_sel (service_id);
create index prestation_prestataire_idx on public.prestation_sel (prestataire_id);
create index prestation_beneficiaire_idx on public.prestation_sel (beneficiaire_id);
create index prestation_statut_idx on public.prestation_sel (statut);
-- Index pour la requête de crédit auto : prestations en modération
-- depuis plus de 2 h, qu'on doit créditer.
create index prestation_a_crediter_idx on public.prestation_sel (declaree_realisee_le)
  where statut = 'en_moderation';

create trigger prestation_sel_updated_at
  before update on public.prestation_sel
  for each row
  execute function public.tg_set_updated_at();

alter table public.prestation_sel enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : prestataire ou bénéficiaire voient leurs prestations ;
-- modé/admin tout.
create policy "prestation_sel_select"
  on public.prestation_sel for select
  using (
    prestataire_id = auth.uid()
    or beneficiaire_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('sel')
  );

-- Insertion : auth requise, l'usager·ère doit être prestataire OU
-- bénéficiaire (selon le sens du service). La logique fine est dans
-- la Server Action.
create policy "prestation_sel_insert"
  on public.prestation_sel for insert
  with check (
    auth.uid() is not null
    and (prestataire_id = auth.uid() or beneficiaire_id = auth.uid())
  );

-- Update : les deux personnes impliquées peuvent agir (déclarer
-- réalisée, contester, annuler). Admin pour modération.
create policy "prestation_sel_update"
  on public.prestation_sel for update
  using (
    prestataire_id = auth.uid()
    or beneficiaire_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('sel')
  );

-- ============================================================
-- Fonction : prestations à créditer (utilisée par un cron applicatif).
-- Liste les prestations en_moderation depuis plus de 2 h sans contestation.
-- SECURITY DEFINER pour permettre l'appel par le job de crédit.
-- ============================================================
create or replace function public.prestations_a_crediter(seuil_minutes integer default 120)
returns setof public.prestation_sel
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.prestation_sel
  where statut = 'en_moderation'
    and declaree_realisee_le is not null
    and declaree_realisee_le <= now() - make_interval(mins => seuil_minutes);
$$;

comment on function public.prestations_a_crediter(integer) is
  'Liste les prestations SEL dont le délai de modération de 2 h est écoulé et qui doivent être créditées en T99CP.';

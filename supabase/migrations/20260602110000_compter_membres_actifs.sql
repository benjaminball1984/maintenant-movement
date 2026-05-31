-- ============================================================================
-- Revue 2026 (décision D1) — Compteur public des membres actifs.
-- ============================================================================
--
-- Décision Lilou/Ben du 2026-05-31 : un·e « membre actif·ve » est une personne
-- ayant une ADHÉSION EN COURS DE VALIDITÉ (statut 'active' et non expirée,
-- l'adhésion étant valable un an). Le compteur public (« nous sommes X ») ne
-- compte QUE ces adhérent·es à jour, et chaque personne UNE seule fois (une
-- personne peut avoir plusieurs lignes d'adhésion au fil des renouvellements).
--
-- On expose un agrégat (count distinct), jamais de PII : SECURITY DEFINER pour
-- ne pas dépendre de la RLS de `adhesion`, sur le modèle de `nombre_signatures`.
--
-- Migration ADDITIVE (doctrine de greffe §0.3) : aucune table ni donnée touchée.
-- ============================================================================

create or replace function public.compter_membres_actifs()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct personne_id)::bigint
  from public.adhesion
  where statut = 'active'
    and expire_le > now();
$$;

comment on function public.compter_membres_actifs() is
  'Nombre de membres actifs (décision D1, revue 2026) : personnes DISTINCTES ayant une adhésion en cours de validité (statut active, expire_le > now()). Agrégat public, aucune PII exposée.';

grant execute on function public.compter_membres_actifs() to anon, authenticated;

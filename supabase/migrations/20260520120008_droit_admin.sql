-- Migration 008 : table `droit_admin`.
--
-- Modélise les permissions administratives. Plusieurs niveaux possibles :
--   - 'national'    : équipe nationale, accès complet (journalisé)
--   - 'admin'       : administration générale (étape entre national et modération)
--   - 'moderation'  : console de modération (filtrable par onglet)
--   - 'tresorerie'  : gestion financière (Stripe Connect, cagnottes)
--   - 'animation'   : animation d'une commune (scope_commune_id requis)
--   - 'dpd'         : Délégué·e à la protection des données (RGPD §7), accès au journal admin
--
-- Pour 'moderation', `perimetre_onglet` permet de limiter à certains onglets
-- (pétitions, mobilisations, cagnottes, etc., cf. spec §11).
--
-- Pour 'animation', `scope_commune_id` indique la commune concernée.
--
-- L'historique est conservé : un droit retiré garde sa ligne avec
-- `retire_le` renseigné, pour audit.

create table public.droit_admin (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references public.personne(id) on delete cascade,

  niveau text not null,
  scope_commune_id uuid references public.commune(id) on delete cascade,
  perimetre_onglet text[],

  -- Traçabilité
  accorde_par uuid references public.personne(id) on delete set null,
  accorde_le timestamptz not null default now(),
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,

  constraint droit_admin_niveau_valide
    check (niveau in ('national', 'admin', 'moderation', 'tresorerie', 'animation', 'dpd')),
  -- Le scope_commune_id n'a de sens que pour le niveau 'animation'.
  constraint droit_admin_scope_coherent
    check (
      (niveau = 'animation' and scope_commune_id is not null)
      or (niveau <> 'animation' and scope_commune_id is null)
    ),
  -- Le perimetre_onglet n'a de sens que pour le niveau 'moderation'.
  constraint droit_admin_perimetre_coherent
    check (
      perimetre_onglet is null or niveau = 'moderation'
    )
);

comment on table public.droit_admin is 'Permissions admin par personne. Historique conservé (retire_le) pour audit.';

-- Index sur les droits actifs (retire_le is null) : c'est ce qu'on consulte
-- en permanence depuis les helpers RLS.
create index droit_admin_personne_actifs_idx
  on public.droit_admin (personne_id, niveau) where retire_le is null;
create index droit_admin_scope_commune_idx
  on public.droit_admin (scope_commune_id) where retire_le is null;

alter table public.droit_admin enable row level security;

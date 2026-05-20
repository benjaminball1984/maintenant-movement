-- Migration 009 : table `journal_admin` (audit log RGPD §5K).
--
-- Toute action admin journalisée : modération, attribution/retrait de droit,
-- suppression de contenu, export ZIP, anonymisation, etc.
--
-- Conservation : 3 ans (cf. docs/specs/05_RGPD.md §4). Un cron périodique
-- purgera les entrées trop anciennes (chantier dédié plus tard).
--
-- Consultable par DPD et cosec gé uniquement (politique RLS).

create table public.journal_admin (
  id bigserial primary key,

  admin_id uuid references public.personne(id) on delete set null,

  action text not null,
  cible_table text,
  cible_id uuid,

  ancien_etat jsonb,
  nouvel_etat jsonb,

  ip text,
  user_agent text,

  cree_le timestamptz not null default now()
);

comment on table public.journal_admin is 'Audit log des actions admin. Conservation 3 ans (RGPD §4). Consultable DPD + cosec gé.';

-- Index pour les requêtes admin classiques (par admin, par action, par date).
create index journal_admin_admin_idx on public.journal_admin (admin_id, cree_le desc);
create index journal_admin_action_idx on public.journal_admin (action, cree_le desc);
create index journal_admin_cible_idx on public.journal_admin (cible_table, cible_id) where cible_id is not null;
create index journal_admin_date_idx on public.journal_admin (cree_le desc);

alter table public.journal_admin enable row level security;

-- Migration 016 : table `campagne`.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §5B et docs/specs/08_PLAN_CHANTIERS.md
-- (chantier 3.2) :
--   - Modération a priori (avant publication, comme les pétitions).
--   - « Modules combinables : pétition + mobilisation + cagnotte + page
--     éditoriale + sondage. » Voir migration 017 pour la table de jonction.
--
-- Cycle de vie :
--   en_moderation → publiee | rejetee
--   publiee       → archivee (manuel, fin de campagne)
--   rejetee       → terminal (ré-soumission via nouvelle ligne)

create table public.campagne (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  texte text not null,                    -- présentation longue de la campagne
  image_url text,

  -- Provenance
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- Modération a priori (cf. spec §11 « Modération adaptée »).
  statut text not null default 'en_moderation',
  modere_par uuid references public.personne(id) on delete set null,
  modere_le timestamptz,
  raison_rejet text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint campagne_statut_valide
    check (statut in ('en_moderation', 'publiee', 'rejetee', 'archivee')),
  constraint campagne_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint campagne_rejet_coherent
    check (
      (statut = 'rejetee' and raison_rejet is not null)
      or statut <> 'rejetee'
    ),
  constraint campagne_moderation_coherente
    check (
      (modere_par is null and modere_le is null)
      or (modere_par is not null and modere_le is not null)
    )
);

comment on table public.campagne is 'Campagne (assemblage thématique : pétition + mobilisation + cagnotte + ...). Modération a priori.';
comment on column public.campagne.statut is 'en_moderation | publiee | rejetee | archivee';

create index campagne_statut_idx on public.campagne (statut);
create index campagne_createurice_idx on public.campagne (createurice_id);
create index campagne_publiee_recente_idx on public.campagne (created_at desc)
  where statut = 'publiee';

create trigger campagne_updated_at
  before update on public.campagne
  for each row
  execute function public.tg_set_updated_at();

alter table public.campagne enable row level security;

-- ============================================================
-- Politiques RLS (calquées sur petition)
-- ============================================================

create policy "campagne_select"
  on public.campagne for select
  using (
    statut = 'publiee'
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('campagnes')
  );

create policy "campagne_insert_auth"
  on public.campagne for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

create policy "campagne_update"
  on public.campagne for update
  using (
    (createurice_id = auth.uid() and statut = 'en_moderation')
    or public.est_admin_general()
    or public.est_moderateurice('campagnes')
  );

-- Pas de DELETE : archivage en remplacement.

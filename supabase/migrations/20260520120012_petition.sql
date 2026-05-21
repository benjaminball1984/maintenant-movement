-- Migration 012 : table `petition`.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §5A et docs/specs/08_PLAN_CHANTIERS.md
-- (chantier 3.1) :
--   - Modération a priori (avant publication).
--   - Compteur stretch ×1,5 à 90 % de l'objectif (calcul applicatif, pas en BDD).
--   - Modèle : titre, image, texte, destinataire, objectif chiffré, créateurice.
--
-- Cycle de vie :
--   en_moderation → publiee | rejetee
--   publiee       → archivee (manuel)
--   rejetee       → (terminal, mais re-soumission possible avec nouvelle ligne)

create table public.petition (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  texte text not null,
  destinataire text not null,
  image_url text,

  -- Objectif chiffré (nombre de signataires visés)
  objectif integer not null,

  -- Provenance
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- Modération a priori
  statut text not null default 'en_moderation',
  modere_par uuid references public.personne(id) on delete set null,
  modere_le timestamptz,
  raison_rejet text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint petition_statut_valide
    check (statut in ('en_moderation', 'publiee', 'rejetee', 'archivee')),
  constraint petition_objectif_positif
    check (objectif >= 1 and objectif <= 10000000),
  constraint petition_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Cohérence : si statut = rejetee, raison_rejet doit être renseignée.
  constraint petition_rejet_coherent
    check (
      (statut = 'rejetee' and raison_rejet is not null)
      or statut <> 'rejetee'
    ),
  -- Cohérence : si modere_par renseigné, modere_le aussi.
  constraint petition_moderation_coherente
    check (
      (modere_par is null and modere_le is null)
      or (modere_par is not null and modere_le is not null)
    )
);

comment on table public.petition is 'Pétition citoyenne. Modération a priori. Compteur stretch ×1,5 à 90 % calculé côté app.';
comment on column public.petition.statut is 'en_moderation | publiee | rejetee | archivee';

create index petition_statut_idx on public.petition (statut);
create index petition_createurice_idx on public.petition (createurice_id);
create index petition_publiee_recente_idx on public.petition (created_at desc) where statut = 'publiee';

create trigger petition_updated_at
  before update on public.petition
  for each row
  execute function public.tg_set_updated_at();

alter table public.petition enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : pétitions publiées en lecture publique ; créateurice voit
-- aussi ses pétitions en attente et rejetées ; modérateurice (avec onglet
-- 'petitions' dans son périmètre) voit tout pour pouvoir modérer.
create policy "petition_select"
  on public.petition for select
  using (
    statut = 'publiee'
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('petitions')
  );

-- Création : auth requise, statut initial forcé à 'en_moderation' (côté app).
create policy "petition_insert_auth"
  on public.petition for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

-- Mise à jour : créateurice peut éditer ses propres pétitions en attente.
-- Modérateurice peut changer le statut.
create policy "petition_update"
  on public.petition for update
  using (
    (createurice_id = auth.uid() and statut = 'en_moderation')
    or public.est_admin_general()
    or public.est_moderateurice('petitions')
  );

-- Pas de DELETE côté RLS : on archive plutôt que supprimer (préserver
-- l'historique politique). Admin peut supprimer via service_role si
-- vraiment nécessaire (rare).

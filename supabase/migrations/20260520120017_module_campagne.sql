-- Migration 017 : table `module_campagne`.
--
-- Jointure d'une `campagne` à ses modules combinables (spec §5B) :
--   pétition + mobilisation + cagnotte + page éditoriale + sondage.
--
-- Plutôt que 5 colonnes FK distinctes (toujours quatre NULL sur cinq),
-- on utilise un `type_module` + `cible_id` polymorphe. Le DB n'enforce
-- pas la cohérence référentielle de la cible (Postgres ne fait pas de
-- FK polymorphes proprement) : la Server Action `attacherModule` valide
-- l'existence et le statut de la cible avant l'insert.
--
-- La page éditoriale est un cas spécial : pas de cible référentielle,
-- le texte est stocké en colonne `contenu_editorial` (markdown léger).

create table public.module_campagne (
  id uuid primary key default gen_random_uuid(),

  campagne_id uuid not null references public.campagne(id) on delete cascade,

  -- Type du module attaché. Détermine ce que `cible_id` référence
  -- (vérifié côté Server Action, pas par FK Postgres).
  type_module text not null,

  -- UUID de l'entité cible (petition, mobilisation, cagnotte, sondage).
  -- Null pour `type_module = 'page_editoriale'`.
  cible_id uuid,

  -- Contenu inline pour la page éditoriale. Null pour les autres types.
  -- Markdown léger, limité à 10 000 caractères pour rester raisonnable.
  contenu_editorial text,

  -- Position d'affichage dans la campagne (1 = en haut, 2 = sous, ...).
  ordre integer not null default 1,

  created_at timestamptz not null default now(),

  constraint module_type_valide
    check (type_module in ('petition', 'mobilisation', 'cagnotte', 'sondage', 'page_editoriale')),
  -- Cohérence type ↔ champs requis :
  --   page_editoriale → contenu_editorial requis, cible_id null.
  --   autres types     → cible_id requis, contenu_editorial null.
  constraint module_payload_coherent
    check (
      (type_module = 'page_editoriale'
        and contenu_editorial is not null
        and cible_id is null)
      or (type_module <> 'page_editoriale'
        and cible_id is not null
        and contenu_editorial is null)
    ),
  constraint module_contenu_taille
    check (contenu_editorial is null or length(contenu_editorial) <= 10000),
  constraint module_ordre_positif
    check (ordre >= 1)
);

-- Anti-doublon : on n'attache pas deux fois la même cible (petition X
-- deux fois sur la même campagne, par exemple).
create unique index module_campagne_unique_cible
  on public.module_campagne (campagne_id, type_module, cible_id)
  where cible_id is not null;

create index module_campagne_par_campagne_idx
  on public.module_campagne (campagne_id, ordre);

comment on table public.module_campagne is 'Module attaché à une campagne (pétition / mobilisation / cagnotte / sondage / page éditoriale).';
comment on column public.module_campagne.cible_id is 'UUID de la cible (petition.id, mobilisation.id, etc.). Null pour page_editoriale.';

alter table public.module_campagne enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : les modules suivent la visibilité de leur campagne. Si la
-- campagne est lisible (publiée ou propriétaire), ses modules le sont.
create policy "module_campagne_select"
  on public.module_campagne for select
  using (
    exists (
      select 1 from public.campagne c
      where c.id = module_campagne.campagne_id
        and (
          c.statut = 'publiee'
          or c.createurice_id = auth.uid()
          or public.est_admin_general()
          or public.est_moderateurice('campagnes')
        )
    )
  );

-- Insertion / mise à jour / suppression : la créateurice de la campagne
-- gère ses modules tant qu'elle est en attente de modération. Modé/admin
-- aussi (utile pour ajouter une page éditoriale de cadrage par exemple).
create policy "module_campagne_insert"
  on public.module_campagne for insert
  with check (
    exists (
      select 1 from public.campagne c
      where c.id = module_campagne.campagne_id
        and (
          (c.createurice_id = auth.uid() and c.statut = 'en_moderation')
          or public.est_admin_general()
          or public.est_moderateurice('campagnes')
        )
    )
  );

create policy "module_campagne_update"
  on public.module_campagne for update
  using (
    exists (
      select 1 from public.campagne c
      where c.id = module_campagne.campagne_id
        and (
          (c.createurice_id = auth.uid() and c.statut = 'en_moderation')
          or public.est_admin_general()
          or public.est_moderateurice('campagnes')
        )
    )
  );

create policy "module_campagne_delete"
  on public.module_campagne for delete
  using (
    exists (
      select 1 from public.campagne c
      where c.id = module_campagne.campagne_id
        and (
          (c.createurice_id = auth.uid() and c.statut = 'en_moderation')
          or public.est_admin_general()
          or public.est_moderateurice('campagnes')
        )
    )
  );

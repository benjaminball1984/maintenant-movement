-- Migration 015 : table `participation_mobilisation` + helper `nombre_participant_es`.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §5C et §12 :
--   - « Statut "je participe" d'un clic, anonyme par défaut ».
--   - Code postal **non** obligatoire pour ce formulaire-là (exception
--     explicite de §12 « Code postal obligatoire »). La participation
--     anonyme reste un simple compteur.
--
-- Modèle :
--   - Connectée  : ligne avec personne_id, unique sur (mobilisation_id, personne_id).
--   - Anonyme    : ligne avec personne_id null (pas de contrainte unique
--                  applicable, dédoublonnage UX via cookie côté client).

create table public.participation_mobilisation (
  id uuid primary key default gen_random_uuid(),

  mobilisation_id uuid not null references public.mobilisation(id) on delete cascade,

  -- Personne authentifiée (si participation connectée) ou null (anonyme).
  personne_id uuid references public.personne(id) on delete set null,

  -- Optionnel : code postal si la personne veut être tagguée newsletter
  -- (cf. spec §10). Pas obligatoire (le clic reste libre).
  code_postal text,

  -- Optionnel : si la personne accepte d'être notifiée par email pour
  -- rappel/changement de programme. `personne_id` est rempli si connectée.
  accepte_notifications boolean not null default false,

  created_at timestamptz not null default now(),

  constraint participation_code_postal_format
    check (code_postal is null or code_postal ~ '^\d{5}$')
);

-- Anti-doublon connectée : une personne connectée ne peut « participer »
-- qu'une fois à une mobilisation donnée. La contrainte unique partielle
-- (WHERE personne_id IS NOT NULL) laisse passer les anonymes (qui n'ont
-- pas de personne_id à dédoublonner côté BDD).
create unique index participation_unique_connectee
  on public.participation_mobilisation (mobilisation_id, personne_id)
  where personne_id is not null;

create index participation_mobilisation_idx
  on public.participation_mobilisation (mobilisation_id, created_at desc);
create index participation_personne_idx
  on public.participation_mobilisation (personne_id) where personne_id is not null;

comment on table public.participation_mobilisation is 'Clic « je participe » sur une mobilisation. Anonyme possible. Unique par personne_id quand connectée.';
comment on column public.participation_mobilisation.personne_id is 'Renseigné si la participante était connectée au moment du clic.';

alter table public.participation_mobilisation enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : agrégat (count) accessible via la fonction SECURITY DEFINER
-- ci-dessous. Lecture ligne à ligne réservée à :
--   - la participante elle-même (si connectée),
--   - la créateurice de la mobilisation (pour notifier),
--   - modé / admin.
create policy "participation_select"
  on public.participation_mobilisation for select
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('mobilisations')
    or exists (
      select 1 from public.mobilisation m
      where m.id = participation_mobilisation.mobilisation_id
        and m.createurice_id = auth.uid()
    )
  );

-- Insertion : ouverte. La personne anonyme insère avec `personne_id = null` ;
-- la personne connectée insère avec `personne_id = auth.uid()`.
create policy "participation_insert"
  on public.participation_mobilisation for insert
  with check (
    personne_id is null
    or personne_id = auth.uid()
  );

-- Suppression : la participante peut retirer sa participation (droit
-- RGPD d'opposition côté connecté ; les anonymes n'ont pas d'identité
-- à associer côté serveur). Admin aussi.
create policy "participation_delete"
  on public.participation_mobilisation for delete
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
  );

-- ============================================================
-- Fonction d'agrégat : nombre de participations d'une mobilisation.
-- SECURITY DEFINER pour ne pas exposer la table en lecture publique
-- tout en autorisant le count() agrégé.
-- ============================================================
create or replace function public.nombre_participant_es(mobilisation_a_compter uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.participation_mobilisation
  where mobilisation_id = mobilisation_a_compter;
$$;

comment on function public.nombre_participant_es(uuid) is
  'Nombre total de participations « je participe » d''une mobilisation. Lisible publiquement.';

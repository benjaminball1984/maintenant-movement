-- Tables `salle_decider`, `reunion_decider`, `vote_decider` (V2.4.10).
--
-- Cf. spec V1 §4F + doctrine V2 « Décider » (chantier 7.6).
--
-- Salles dédiées par espace (commune, fédération, GT, etc.). Réunions
-- avec ordre du jour, 3 modes de décision (consensus, levée d'objections,
-- jugement majoritaire). Votes nominaux ou anonymes selon la décision
-- du collectif.
--
-- LiveKit non branché à ce stade : `livekit_room_name` est posée mais
-- restera nullable. Quand LiveKit Cloud (ou self-hosted) sera branché,
-- la Server Action de démarrage de réunion remplira la valeur.
--
-- À appliquer avec `supabase db push`. Non appliquée distant.

-- ============================================================
-- 1. Table `salle_decider`
-- ============================================================
create table if not exists public.salle_decider (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (length(slug) between 1 and 100),
  nom text not null check (length(nom) between 1 and 200),
  description text,

  -- Rattachement à un espace (commune, federation, gt, etc.). FK
  -- polymorphe gérée applicativement.
  espace_type text not null check (espace_type in (
    'commune', 'federation', 'confederation', 'gt_thematique',
    'campagne', 'groupe_entraide_local', 'national'
  )),
  espace_id uuid, -- null pour 'national'

  -- Privacy par périmètre (cf. spec §4F).
  type_visibilite text not null default 'membres' check (type_visibilite in (
    'membres',     -- membres de l'espace uniquement
    'fedeere',     -- membres du périmètre fédéré
    'public'       -- accès libre, enregistrement systématique
  )),

  -- Nom de la room LiveKit (rempli quand visio démarrée).
  livekit_room_name text,

  -- Métadonnées libres (couleur, icône, lien externe, etc.).
  metadata jsonb not null default '{}'::jsonb,

  createurice_id uuid references public.personne(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists salle_decider_slug_idx
  on public.salle_decider (slug);

create index if not exists salle_decider_espace_idx
  on public.salle_decider (espace_type, espace_id);

alter table public.salle_decider enable row level security;

-- Lecture : selon type_visibilite. Pour MVP : tout le monde voit la liste.
drop policy if exists "salle_decider_select_public" on public.salle_decider;
create policy "salle_decider_select_public"
  on public.salle_decider
  for select
  using (true);

-- Création / modification : admin national + cosec gé (à brancher).
drop policy if exists "salle_decider_insert_admin" on public.salle_decider;
create policy "salle_decider_insert_admin"
  on public.salle_decider
  for insert
  with check (public.est_admin_general());

drop policy if exists "salle_decider_update_admin" on public.salle_decider;
create policy "salle_decider_update_admin"
  on public.salle_decider
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

-- ============================================================
-- 2. Table `reunion_decider`
-- ============================================================
create table if not exists public.reunion_decider (
  id uuid primary key default gen_random_uuid(),
  salle_id uuid not null references public.salle_decider(id) on delete cascade,
  titre text not null check (length(titre) between 1 and 300),
  ordre_jour_md text not null default '',

  debut_le timestamptz not null,
  fin_le timestamptz,

  -- Mode de décision principal de la réunion (peut être par item d'ordre du jour côté votes).
  mode_decision text not null default 'consensus' check (mode_decision in (
    'consensus',
    'levee_objections',
    'jugement_majoritaire'
  )),

  statut text not null default 'planifiee' check (statut in (
    'planifiee',
    'en_cours',
    'terminee',
    'annulee'
  )),

  enregistree boolean not null default false,
  pv_md text, -- procès-verbal en Markdown

  convoque_par_personne_id uuid references public.personne(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reunion_decider_dates_coherentes
    check (fin_le is null or fin_le >= debut_le)
);

create index if not exists reunion_decider_salle_idx
  on public.reunion_decider (salle_id, debut_le desc);

create index if not exists reunion_decider_a_venir_idx
  on public.reunion_decider (debut_le)
  where statut in ('planifiee', 'en_cours');

alter table public.reunion_decider enable row level security;

drop policy if exists "reunion_decider_select_public" on public.reunion_decider;
create policy "reunion_decider_select_public"
  on public.reunion_decider
  for select
  using (true);

drop policy if exists "reunion_decider_insert_admin" on public.reunion_decider;
create policy "reunion_decider_insert_admin"
  on public.reunion_decider
  for insert
  with check (public.est_admin_general());

drop policy if exists "reunion_decider_update_admin" on public.reunion_decider;
create policy "reunion_decider_update_admin"
  on public.reunion_decider
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

-- ============================================================
-- 3. Table `vote_decider`
-- ============================================================
create table if not exists public.vote_decider (
  id uuid primary key default gen_random_uuid(),
  reunion_id uuid not null references public.reunion_decider(id) on delete cascade,
  question text not null check (length(question) between 5 and 2000),
  mode text not null check (mode in (
    'consensus',
    'levee_objections',
    'jugement_majoritaire'
  )),

  -- Options pour le jugement majoritaire (max 10).
  options text[] not null default '{}',

  -- Statut du vote.
  statut text not null default 'ouvert' check (statut in (
    'ouvert',
    'clos',
    'annule'
  )),

  -- Pour le jugement majoritaire : mention médiane retenue (Excellent →
  -- À rejeter). Pour les autres modes : NULL.
  resultat text,

  -- Récapitulatif libre (compte bulletins, objections, etc.).
  recapitulatif_md text,

  ouvert_le timestamptz not null default now(),
  clos_le timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vote_decider_reunion_idx
  on public.vote_decider (reunion_id);

alter table public.vote_decider enable row level security;

drop policy if exists "vote_decider_select_public" on public.vote_decider;
create policy "vote_decider_select_public"
  on public.vote_decider
  for select
  using (true);

drop policy if exists "vote_decider_insert_admin" on public.vote_decider;
create policy "vote_decider_insert_admin"
  on public.vote_decider
  for insert
  with check (public.est_admin_general());

drop policy if exists "vote_decider_update_admin" on public.vote_decider;
create policy "vote_decider_update_admin"
  on public.vote_decider
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

-- ============================================================
-- Triggers updated_at
-- ============================================================
create or replace function public.decider_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists salle_decider_updated_at on public.salle_decider;
create trigger salle_decider_updated_at
  before update on public.salle_decider
  for each row execute function public.decider_set_updated_at();

drop trigger if exists reunion_decider_updated_at on public.reunion_decider;
create trigger reunion_decider_updated_at
  before update on public.reunion_decider
  for each row execute function public.decider_set_updated_at();

drop trigger if exists vote_decider_updated_at on public.vote_decider;
create trigger vote_decider_updated_at
  before update on public.vote_decider
  for each row execute function public.decider_set_updated_at();

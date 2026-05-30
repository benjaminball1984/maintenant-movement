-- ============================================================================
-- Chantier V2.6.13 (épopée réseau V2, chantier B.1) — Entité organisation
-- ============================================================================
--
-- Cf. docs/specs/09_RESEAU-SOCIAL-V2.md §7.
--
-- « Organisation » est un concept ombrelle (tout collectif en est une), mais
-- techniquement on N'EN FUSIONNE AUCUNE : doctrine de greffe §0.3.3 (pas de
-- migration lourde du tronc sans décision dédiée). On ajoute une table
-- `organisation` pour les structures EXTERNES (association, syndicat, ONG…) et
-- on ajoute `organisation` comme `espace_type` supplémentaire dans les CHECK
-- existants, pour que tout le mécanisme « espace » (abonnement, publication au
-- nom de, attribution) marche aussi pour elles. Les tables internes (commune,
-- federation, gt_thematique, groupe_entraide_local) restent INTACTES.
--
-- Migration LOCALE (non poussée au distant avant la Phase M).
-- ============================================================================

-- ============================================================
-- Table : organisation
-- ============================================================
create table if not exists public.organisation (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  nom                text not null,
  type_organisation  text not null default 'autre',
  description        text,
  image_url          text,
  -- Badge « officiel » (anti-usurpation) : accordé par l'admin (voie 2). Tant
  -- qu'il est faux, la page existe mais reste non officielle.
  badge_officiel     boolean not null default false,
  statut             text not null default 'active',
  cree_par           uuid references public.personne(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint organisation_nom_non_vide check (length(btrim(nom)) > 0),
  constraint organisation_type_valide check (type_organisation in (
    'collectif',
    'association',
    'syndicat',
    'mouvement',
    'fondation',
    'ong',
    'cooperative',
    'entreprise',
    'groupe',
    'autre'
  )),
  constraint organisation_statut_valide check (statut in ('active', 'suspendue'))
);

comment on table public.organisation is
  'Organisation externe (association, syndicat, ONG…) avec page réseau suivable. Espace polymorphe espace_type=organisation.';
comment on column public.organisation.badge_officiel is
  'Certification anti-usurpation accordée par l''admin (voie 2). Faux = page non officielle.';
comment on column public.organisation.cree_par is
  'Personne qui a créé la page (gestionnaire provisoire jusqu''à officialisation, cf. B.2).';

create index if not exists organisation_statut_idx on public.organisation (statut);
create index if not exists organisation_type_idx on public.organisation (type_organisation);

-- Trigger updated_at (même fonction que le reste du schéma).
drop trigger if exists organisation_set_updated_at on public.organisation;
create trigger organisation_set_updated_at
  before update on public.organisation
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.organisation enable row level security;

-- Lecture : pages publiques (statut active). Les pages suspendues ne sont
-- visibles que de l'admin et de leur créateur·ice.
create policy "organisation_select" on public.organisation for select
  using (
    statut = 'active'
    or cree_par = auth.uid()
    or public.est_admin_general()
  );

-- Création : toute personne connectée crée une organisation en son nom.
create policy "organisation_insert" on public.organisation for insert
  with check (cree_par = auth.uid());

-- Mise à jour : le·la créateur·ice (gestion provisoire) ou l'admin. La gestion
-- fine par gestionnaire viendra en B.2 (élargira cette policy).
create policy "organisation_update" on public.organisation for update
  using (cree_par = auth.uid() or public.est_admin_general())
  with check (cree_par = auth.uid() or public.est_admin_general());

-- Suppression : admin seulement (les organisations ont des abonnés/contenus).
create policy "organisation_delete" on public.organisation for delete
  using (public.est_admin_general());

-- ============================================================
-- Extension des CHECK espace_type existants (additif : on élargit la liste)
-- ============================================================
-- Abonnement à un espace réseau : on autorise désormais espace_type=organisation.
alter table public.abonnement_espace_reseau
  drop constraint if exists abonnement_espace_type_valide;
alter table public.abonnement_espace_reseau
  add constraint abonnement_espace_type_valide check (espace_type in (
    'commune',
    'federation',
    'confederation',
    'gt_thematique',
    'groupe_entraide_local',
    'campagne',
    'organisation'
  ));

-- Publication au nom d'un espace : idem.
alter table public.post_reseau
  drop constraint if exists post_reseau_espace_type_valide;
alter table public.post_reseau
  add constraint post_reseau_espace_type_valide check (
    espace_type is null
    or espace_type in (
      'commune',
      'federation',
      'confederation',
      'gt_thematique',
      'groupe_entraide_local',
      'campagne',
      'organisation'
    )
  );

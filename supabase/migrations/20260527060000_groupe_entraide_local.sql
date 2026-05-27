-- Tables `groupe_entraide_local` + `appartenance_groupe_entraide_local`
-- (cycle V2, fiche `docs/cdc-v2/CDC-Maintenant-V2/03-Sentraider/groupe-entraide-local-V2.md`,
-- chantier V2.3.2).
--
-- **Sous-espace porte d'entrée NON-POLITIQUE** : certaines personnes
-- ne veulent pas du cœur politique (pétitions, Décider) mais veulent
-- s'entraider localement. Le groupe d'entraide local est un agrégateur
-- d'outils d'entraide (prêt, marché, SEL, fruits, hébergement, covoit')
-- + moments solidaires + mobilisations, sans les outils politiques.
--
-- Greffe additive : aucune table V1 touchée. La fonction
-- `est_membre_espace` posée en V2.2.1 (FilDeGroupe) est mise à jour pour
-- lire la vraie table d'appartenance (au lieu du fallback
-- `auth.uid() is not null`).
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit.

-- ============================================================
-- 1. Table `groupe_entraide_local`
-- ============================================================
create table if not exists public.groupe_entraide_local (
  id uuid primary key default gen_random_uuid(),

  -- Slug public pour les URLs (« /s-entraider/groupes-locaux/maraude-lyon-7 »).
  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' and length(slug) between 3 and 80),

  -- Nom affiché du groupe (« Maraude solidaire Lyon 7 », « Voisinage rue X »…).
  nom text not null check (length(nom) between 3 and 200),

  -- Chapô court (sur la liste + en partage).
  description_courte text not null check (length(description_courte) between 10 and 500),

  -- Description complète (sur la page détail).
  description text not null check (length(description) between 10 and 5000),

  -- Localisation libre (« Lyon 7e », « AMAP du Plateau », « Immeuble 5 rue X »).
  -- Pas obligatoirement une commune INSEE — un groupe peut couvrir un immeuble.
  zone_geographique text not null check (length(zone_geographique) between 2 and 200),

  -- Coordonnées géographiques pour la carte transversale (optionnelles ;
  -- si vides, le groupe n'apparaît pas sur la carte mais reste listable).
  latitude double precision,
  longitude double precision,
  constraint groupe_entraide_local_coords_coherentes
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180)
    ),

  -- Image de couverture (optionnelle). Image par défaut sinon (ET1).
  image_url text,

  -- Statut administratif. `en_moderation` à la création (cohérent avec les
  -- autres entités du repo : pétition, mobilisation, etc.).
  statut text not null default 'en_moderation' check (statut in (
    'en_moderation', 'publie', 'suspendu', 'ferme'
  )),

  -- Créateurice du groupe (preset « créateur d'espace » de MD4 V2 à appliquer
  -- côté Server Action quand les droits V2 seront branchés).
  createurice_id uuid not null references public.personne(id) on delete restrict,

  -- Outils activés (cf. fiche §Périmètre d'outils). Liste de booléens
  -- contrôlés par les paramètres du groupe. Défaut = entraide + moments
  -- + mobilisations, sans pétitions/Décider (porte d'entrée non-politique).
  outil_pret_active boolean not null default true,
  outil_marche_active boolean not null default true,
  outil_sel_active boolean not null default true,
  outil_fruits_active boolean not null default true,
  outil_hebergement_active boolean not null default true,
  outil_transport_active boolean not null default true,
  outil_moments_active boolean not null default true,
  outil_mobilisations_active boolean not null default true,
  outil_petitions_active boolean not null default false,
  outil_decider_active boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.groupe_entraide_local is
  'Groupe d''entraide local V2 : porte d''entrée non-politique (fiche §Constat).';
comment on column public.groupe_entraide_local.outil_petitions_active is
  'Désactivé par défaut : porte d''entrée non-politique. Activable plus tard si le groupe vote la bascule.';

create index if not exists groupe_entraide_local_statut_idx
  on public.groupe_entraide_local(statut, created_at desc);

create index if not exists groupe_entraide_local_geoloc_idx
  on public.groupe_entraide_local(latitude, longitude)
  where latitude is not null and longitude is not null;

create index if not exists groupe_entraide_local_createur_idx
  on public.groupe_entraide_local(createurice_id);

-- ============================================================
-- 2. Table `appartenance_groupe_entraide_local`
-- ============================================================
create table if not exists public.appartenance_groupe_entraide_local (
  id uuid primary key default gen_random_uuid(),

  groupe_id uuid not null references public.groupe_entraide_local(id) on delete cascade,
  personne_id uuid not null references public.personne(id) on delete cascade,

  -- Rôle dans le groupe. Liste fermée extensible. `membre` par défaut ;
  -- `animateur` = preset « créateur d'espace » (MD4 V2) — donne accès aux
  -- paramètres et à la modération.
  role_groupe text not null default 'membre' check (role_groupe in (
    'membre', 'animateur'
  )),

  rejoint_le timestamptz not null default now(),
  quitte_le timestamptz,

  -- Soft delete : on garde l'historique des passages (utile pour la
  -- modération / la lutte contre le squat §4 V2).
  est_active boolean not null default true,

  constraint appartenance_groupe_entraide_local_etat_coherent
    check (
      (est_active = true and quitte_le is null)
      or (est_active = false and quitte_le is not null)
    )
);

comment on table public.appartenance_groupe_entraide_local is
  'Appartenance d''une personne à un groupe d''entraide local. Soft delete via est_active.';

-- Unicité : une seule appartenance active par (groupe, personne).
create unique index if not exists appartenance_groupe_entraide_local_unique_active
  on public.appartenance_groupe_entraide_local(groupe_id, personne_id)
  where est_active = true;

create index if not exists appartenance_groupe_entraide_local_groupe_idx
  on public.appartenance_groupe_entraide_local(groupe_id, est_active);

create index if not exists appartenance_groupe_entraide_local_personne_idx
  on public.appartenance_groupe_entraide_local(personne_id, est_active);

-- ============================================================
-- 3. Triggers updated_at
-- ============================================================
create or replace function public.groupe_entraide_local_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists groupe_entraide_local_updated_at_trigger on public.groupe_entraide_local;
create trigger groupe_entraide_local_updated_at_trigger
  before update on public.groupe_entraide_local
  for each row execute function public.groupe_entraide_local_set_updated_at();

-- ============================================================
-- 4. MAJ de `est_membre_espace` pour utiliser la vraie table
-- ============================================================
-- Posé en V2.2.1 avec un fallback `auth.uid() is not null` pour
-- groupe_entraide_local (en l'absence de table d'appartenance). On
-- remplace par la lecture de la table créée ci-dessus.
--
-- VERSION CORRIGÉE (intégrée directement depuis la migration de fix
-- `20260527080000_est_membre_espace_fix.sql` après détection en review
-- du bug fédération/confédération + gt_thematique_id). La migration
-- de fix reste idempotente (CREATE OR REPLACE).
create or replace function public.est_membre_espace(
  espace_type_a_verifier text,
  espace_id_a_verifier uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case espace_type_a_verifier
    when 'commune' then
      exists (
        select 1 from public.appartenance_commune
        where personne_id = auth.uid()
          and commune_id = espace_id_a_verifier
          and est_active = true
      )
    when 'federation' then
      exists (
        select 1
        from public.appartenance_commune ac
        join public.appartenance_federation af
          on af.commune_id = ac.commune_id
         and af.est_active = true
        where ac.personne_id = auth.uid()
          and ac.est_active = true
          and af.federation_id = espace_id_a_verifier
      )
    when 'confederation' then
      exists (
        select 1
        from public.appartenance_commune ac
        join public.appartenance_federation af
          on af.commune_id = ac.commune_id
         and af.est_active = true
        join public.appartenance_confederation aconf
          on aconf.federation_id = af.federation_id
         and aconf.est_active = true
        where ac.personne_id = auth.uid()
          and ac.est_active = true
          and aconf.confederation_id = espace_id_a_verifier
      )
    when 'gt_thematique' then
      exists (
        select 1 from public.appartenance_gt
        where personne_id = auth.uid()
          and gt_thematique_id = espace_id_a_verifier
          and est_active = true
      )
    -- Désormais branché sur la vraie table (V2.3.2) :
    when 'groupe_entraide_local' then
      exists (
        select 1 from public.appartenance_groupe_entraide_local
        where personne_id = auth.uid()
          and groupe_id = espace_id_a_verifier
          and est_active = true
      )
    -- Pour campagne : pas d'appartenance dédiée en V1 (chantier V2 dédié à venir).
    when 'campagne' then auth.uid() is not null
    else false
  end;
$$;

-- ============================================================
-- 5. RLS — groupe_entraide_local
-- ============================================================
alter table public.groupe_entraide_local enable row level security;

-- Lecture : groupes publiés visibles publiquement (cohérent avec pétition,
-- mobilisation, etc.). Créateurice voit son groupe en modération. Admin /
-- modérateur réseau voient tout.
drop policy if exists "groupe_entraide_local_select" on public.groupe_entraide_local;
create policy "groupe_entraide_local_select"
  on public.groupe_entraide_local
  for select
  using (
    statut = 'publie'
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('reseau')
  );

-- Insertion : tout authentifié peut créer un groupe. Statut initial obligé
-- = en_moderation (CHECK applicatif via Server Action + RLS deuxième ligne).
drop policy if exists "groupe_entraide_local_insert_authentifie" on public.groupe_entraide_local;
create policy "groupe_entraide_local_insert_authentifie"
  on public.groupe_entraide_local
  for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
    and statut = 'en_moderation'
  );

-- Mise à jour : createurice tant qu'en modération + animateurs + admin.
drop policy if exists "groupe_entraide_local_update_createur" on public.groupe_entraide_local;
create policy "groupe_entraide_local_update_createur"
  on public.groupe_entraide_local
  for update
  using (
    (createurice_id = auth.uid() and statut = 'en_moderation')
    or exists (
      select 1 from public.appartenance_groupe_entraide_local
      where groupe_id = groupe_entraide_local.id
        and personne_id = auth.uid()
        and role_groupe = 'animateur'
        and est_active = true
    )
    or public.est_admin_general()
    or public.est_moderateurice('reseau')
  );

-- Suppression : admin uniquement.
drop policy if exists "groupe_entraide_local_delete_admin" on public.groupe_entraide_local;
create policy "groupe_entraide_local_delete_admin"
  on public.groupe_entraide_local
  for delete
  using (public.est_admin_general());

-- ============================================================
-- 6. RLS — appartenance_groupe_entraide_local
-- ============================================================
alter table public.appartenance_groupe_entraide_local enable row level security;

-- Lecture : un membre voit la liste des appartenances du groupe (pour
-- afficher les co-membres) ; admin voit tout.
drop policy if exists "appartenance_groupe_entraide_local_select_membres" on public.appartenance_groupe_entraide_local;
create policy "appartenance_groupe_entraide_local_select_membres"
  on public.appartenance_groupe_entraide_local
  for select
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_membre_espace('groupe_entraide_local', groupe_id)
  );

-- Insertion : la personne s'inscrit elle-même. Pas de cooptation forcée.
drop policy if exists "appartenance_groupe_entraide_local_insert_self" on public.appartenance_groupe_entraide_local;
create policy "appartenance_groupe_entraide_local_insert_self"
  on public.appartenance_groupe_entraide_local
  for insert
  with check (
    personne_id = auth.uid()
    and est_active = true
    and quitte_le is null
  );

-- Mise à jour : la personne peut quitter (est_active = false, quitte_le).
-- Les animateurs peuvent gérer (changer rôle, retirer un membre — modération).
drop policy if exists "appartenance_groupe_entraide_local_update_self_ou_animateur" on public.appartenance_groupe_entraide_local;
create policy "appartenance_groupe_entraide_local_update_self_ou_animateur"
  on public.appartenance_groupe_entraide_local
  for update
  using (
    personne_id = auth.uid()
    or exists (
      select 1 from public.appartenance_groupe_entraide_local appartenance_animateur
      where appartenance_animateur.groupe_id = appartenance_groupe_entraide_local.groupe_id
        and appartenance_animateur.personne_id = auth.uid()
        and appartenance_animateur.role_groupe = 'animateur'
        and appartenance_animateur.est_active = true
    )
    or public.est_admin_general()
  );

drop policy if exists "appartenance_groupe_entraide_local_delete_admin" on public.appartenance_groupe_entraide_local;
create policy "appartenance_groupe_entraide_local_delete_admin"
  on public.appartenance_groupe_entraide_local
  for delete
  using (public.est_admin_general());

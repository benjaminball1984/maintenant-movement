-- Migration 010 : fonctions helpers SQL pour les politiques RLS.
--
-- Toutes les fonctions sont `security definer` : elles s'exécutent avec
-- les droits du propriétaire (postgres/supabase_admin) et peuvent donc
-- lire `droit_admin` même si la politique RLS de cette table ne permet
-- pas à l'appelant·e d'y accéder directement.
--
-- Toutes les fonctions s'appuient sur `auth.uid()` : l'id de la personne
-- authentifiée via Supabase Auth. Si personne n'est connecté·e,
-- `auth.uid()` retourne NULL et les fonctions retournent `false`.

-- ============================================================
-- est_admin_national : équipe nationale, accès complet
-- ============================================================
create or replace function public.est_admin_national()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.droit_admin
    where personne_id = auth.uid()
      and niveau = 'national'
      and retire_le is null
  );
$$;

comment on function public.est_admin_national() is 'True si la personne connectée a un droit admin national actif.';

-- ============================================================
-- est_admin_general : national OU admin (deux niveaux les plus larges)
-- ============================================================
create or replace function public.est_admin_general()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.droit_admin
    where personne_id = auth.uid()
      and niveau in ('national', 'admin')
      and retire_le is null
  );
$$;

comment on function public.est_admin_general() is 'True si la personne connectée est admin national ou général.';

-- ============================================================
-- est_moderateurice : true si modération active.
-- Si `onglet_demande` est fourni, vérifie que l'onglet est dans le
-- périmètre (perimetre_onglet null = tous les onglets).
-- ============================================================
create or replace function public.est_moderateurice(onglet_demande text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.droit_admin
    where personne_id = auth.uid()
      and niveau = 'moderation'
      and retire_le is null
      and (
        onglet_demande is null
        or perimetre_onglet is null
        or onglet_demande = any(perimetre_onglet)
      )
  );
$$;

comment on function public.est_moderateurice(text) is 'True si la personne a un droit de modération actif, éventuellement sur un onglet précis.';

-- ============================================================
-- est_animation_commune : true si la personne anime cette commune.
-- ============================================================
create or replace function public.est_animation_commune(commune_a_verifier uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.droit_admin
    where personne_id = auth.uid()
      and niveau = 'animation'
      and scope_commune_id = commune_a_verifier
      and retire_le is null
  );
$$;

comment on function public.est_animation_commune(uuid) is 'True si la personne a un droit d''animation actif sur cette commune.';

-- ============================================================
-- est_membre_commune : true si la personne a une appartenance active
-- à cette commune.
-- ============================================================
create or replace function public.est_membre_commune(commune_a_verifier uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.appartenance_commune
    where personne_id = auth.uid()
      and commune_id = commune_a_verifier
      and est_active = true
  );
$$;

comment on function public.est_membre_commune(uuid) is 'True si la personne a une appartenance active à la commune donnée.';

-- ============================================================
-- est_dpd : true si la personne est désignée DPD (RGPD §7).
-- ============================================================
create or replace function public.est_dpd()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.droit_admin
    where personne_id = auth.uid()
      and niveau = 'dpd'
      and retire_le is null
  );
$$;

comment on function public.est_dpd() is 'True si la personne est Délégué·e à la protection des données (DPD).';

-- ============================================================================
-- Chantier V2.6.10 (épopée réseau V2, chantier D.4) — Cercle amical du flux
-- ============================================================================
--
-- Cf. docs/specs/09_RESEAU-SOCIAL-V2.md §5.
--
-- Le flux affine son classement : ami·es → ami·es d'ami·es → suivis → reste
-- (au lieu de soi → suivis → reste). Les ami·es d'ami·es ne sont PAS lisibles
-- côté client (la RLS de `amitie` ne montre que mes propres lignes), d'où cette
-- fonction SECURITY DEFINER qui calcule, pour le lecteur courant, l'ensemble de
-- son cercle amical avec un niveau de proximité :
--   - niveau 1 : ami·es directs (relation acceptée) ;
--   - niveau 2 : ami·es d'ami·es (hors moi, hors ami·es directs).
--
-- Migration LOCALE (non poussée au distant avant la Phase M). Aucune donnée
-- touchée : fonction de lecture pure.
-- ============================================================================

create or replace function public.cercle_amical_reseau()
returns table (personne_id uuid, niveau int)
language sql
stable
security definer
set search_path = public
as $$
  with mes_amis as (
    select case when demandeur_id = auth.uid() then destinataire_id else demandeur_id end as ami
    from public.amitie
    where statut = 'acceptee'
      and (demandeur_id = auth.uid() or destinataire_id = auth.uid())
  ),
  amis_d_amis as (
    select distinct
      case when a.demandeur_id = m.ami then a.destinataire_id else a.demandeur_id end as p
    from mes_amis m
    join public.amitie a
      on a.statut = 'acceptee'
      and (a.demandeur_id = m.ami or a.destinataire_id = m.ami)
  )
  -- Niveau 1 : ami·es directs.
  select ami as personne_id, 1 as niveau from mes_amis
  union
  -- Niveau 2 : ami·es d'ami·es, en excluant moi et mes ami·es directs.
  select p as personne_id, 2 as niveau
  from amis_d_amis
  where p <> auth.uid()
    and p not in (select ami from mes_amis);
$$;

comment on function public.cercle_amical_reseau() is
  'Cercle amical du lecteur courant : niveau 1 = ami·es directs, niveau 2 = ami·es d''ami·es. Pour le classement du flux (chantier D.4).';

revoke execute on function public.cercle_amical_reseau() from public;
grant execute on function public.cercle_amical_reseau() to authenticated, service_role;

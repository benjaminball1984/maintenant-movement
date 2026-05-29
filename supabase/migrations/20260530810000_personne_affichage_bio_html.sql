-- ============================================================================
-- Chantier V2.5.49 — RPC personne_affichage étendu avec bio_html
-- ============================================================================
--
-- Étend la RPC `personne_affichage(uuid)` pour qu'elle retourne aussi
-- `bio_html` (V2.5.49 ajout colonne sur `personne`). La visibilité suit
-- le même flag `bio` dans `preferences_visibilite` (cohérence : la bio
-- texte et la bio riche sont la même chose côté privacy).
--
-- Greffe additive sur RPC : on DROP + CREATE car PostgreSQL refuse de
-- modifier une `RETURNS TABLE` via CREATE OR REPLACE quand la signature
-- des colonnes change. Aucune donnée perdue (la RPC n'a pas de state,
-- elle calcule à la volée).
--
-- Les call sites TS qui ne consommaient pas `bio_html` continuent de
-- fonctionner (sélection partielle des colonnes).
-- ============================================================================

DROP FUNCTION IF EXISTS public.personne_affichage(uuid);

CREATE FUNCTION public.personne_affichage(cible uuid)
RETURNS TABLE (
  id uuid,
  numero_unique text,
  prenom text,
  nom text,
  pronom text,
  photo_url text,
  bio text,
  bio_html text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
declare
  viewer uuid := auth.uid();
  est_soi boolean;
  est_connecte boolean := viewer is not null;
  est_ami boolean;
  prefs jsonb;
begin
  select (p.id = viewer), p.preferences_visibilite
    into est_soi, prefs
    from public.personne p
    where p.id = cible;
  if not found then
    return;
  end if;

  -- Ami·e = suivi mutuel.
  est_ami := exists (
    select 1 from public.relation_reseau a
    join public.relation_reseau b
      on a.suiveur_id = b.suivi_id and a.suivi_id = b.suiveur_id
    where a.suiveur_id = viewer and a.suivi_id = cible
  );

  return query
  select
    p.id,
    pu.numero_unique,
    case when public.champ_reseau_visible(prefs->>'prenom', est_soi, est_ami, est_connecte)
      then p.prenom end,
    case when public.champ_reseau_visible(prefs->>'nom', est_soi, est_ami, est_connecte)
      then p.nom end,
    case when public.champ_reseau_visible(prefs->>'pronom', est_soi, est_ami, est_connecte)
      then p.pronom end,
    case when public.champ_reseau_visible(prefs->>'photo_url', est_soi, est_ami, est_connecte)
      then p.photo_url end,
    case when public.champ_reseau_visible(prefs->>'bio', est_soi, est_ami, est_connecte)
      then p.bio end,
    -- V2.5.49 — bio_html suit le même flag de visibilité que bio.
    case when public.champ_reseau_visible(prefs->>'bio', est_soi, est_ami, est_connecte)
      then p.bio_html end
  from public.personne p
  left join public.profil_unifie pu on pu.personne_id = p.id
  where p.id = cible;
end;
$$;

COMMENT ON FUNCTION public.personne_affichage(uuid) IS
  'Identité affichable d''une personne pour le lecteur courant (champs masqués selon visibilité). V2.5.49 : ajout bio_html.';

REVOKE EXECUTE ON FUNCTION public.personne_affichage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.personne_affichage(uuid) TO anon, authenticated, service_role;

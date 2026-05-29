-- ============================================================================
-- Chantier V2.5.13.a — Master Plan V2.6 Phase J : image de couverture
--                       personnalisable sur la page profil réseau
-- ============================================================================
--
-- Strictement conforme à la doctrine de greffe (CLAUDE.md §0.3) : ajout
-- d'une colonne nullable. Aucune contrainte qui pourrait casser des lignes
-- existantes. Aucun trigger nouveau.
--
-- Quand `cover_url` est nul, la page profil affiche le bandeau dégradé
-- identitaire `bg-grad` (comportement V2.5.13). Quand renseigné, le
-- bandeau bascule sur l'image fournie en `object-cover`.
--
-- Upload via Supabase Storage : la chaîne stockée est l'URL publique
-- complète. Le bucket `media` existe déjà (cf. chantier V2.0.x storage).
-- ============================================================================

ALTER TABLE personne
    ADD COLUMN IF NOT EXISTS cover_url text;

COMMENT ON COLUMN personne.cover_url IS
    'URL absolue de l''image de couverture du profil réseau. Nul = bandeau dégradé par défaut. Cf. CLAUDE.md §11 Master Plan V2.6 Phase J.';

-- ============================================================================
-- RPC publique pour lire la cover_url d'un profil (donnée non sensible,
-- image décorative). On NE TOUCHE PAS à `personne_affichage` (RPC qui gère
-- le masquage par visibilité) : nouvelle RPC dédiée, additive.
--
-- Retourne :
--   - l'URL si elle est renseignée
--   - NULL sinon (la page profil affichera son bandeau dégradé de repli)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.personne_cover_url(cible uuid)
    RETURNS text
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
AS $$
    SELECT cover_url FROM public.personne WHERE id = cible
$$;

COMMENT ON FUNCTION public.personne_cover_url(uuid) IS
    'Retourne la cover_url publique d''un profil. SECURITY DEFINER pour contourner la RLS personne_select_self_ou_admin.';

-- Lecture autorisée publiquement (la cover est par nature publique).
REVOKE EXECUTE ON FUNCTION public.personne_cover_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.personne_cover_url(uuid) TO anon, authenticated;


-- ============================================================================
-- Chantier V2.5.15 — Master Plan V2.6 Phase K : rôle de maintenance CMS
--                    sans pouvoir politique (cf. §4.2)
-- ============================================================================
--
-- Le Master Plan §K demande explicitement : « la possibilité de donner à
-- une personne un rôle de maintenance CMS sans lui donner de pouvoir
-- politique ». Cohérent avec §4.2 du Master Plan : la plateforme est de
-- la cooptation technique, distincte du pouvoir politique du mouvement.
--
-- Solution conforme à la doctrine de greffe (CLAUDE.md §0.3) :
--   - On AJOUTE le niveau `'cms'` à la CHECK constraint `droit_admin_niveau_valide`.
--   - C'est strictement additif : aucune ligne existante n'est invalidée
--     puisqu'on n'enlève aucun des 6 niveaux déjà autorisés ('national',
--     'admin', 'moderation', 'tresorerie', 'animation', 'dpd').
--   - On DROP la CHECK pour la recréer avec la liste étendue. La doctrine
--     interdit le DROP des données ; pas des contraintes additives.
--
-- Le niveau `'cms'` autorise UNIQUEMENT l'édition des libellés CMS via la
-- console `/admin/national/contenus`. Il n'ouvre AUCUN droit politique
-- (vote en assemblée, modération de contenu, gestion de la trésorerie).
-- C'est un rôle de confiance technique, attribuable à un·e proche pour
-- décharger Lilou/Ben de la maintenance éditoriale.
-- ============================================================================

ALTER TABLE public.droit_admin
    DROP CONSTRAINT IF EXISTS droit_admin_niveau_valide;

ALTER TABLE public.droit_admin
    ADD CONSTRAINT droit_admin_niveau_valide
    CHECK (
        niveau IN (
            'national',     -- co-secrétaire général (lecture seule)
            'admin',        -- admin global plateforme
            'moderation',   -- file de modération
            'tresorerie',   -- caisses
            'animation',    -- animation d'une commune (scope_commune_id)
            'dpd',          -- délégué·e protection des données
            'cms'           -- V2.5.15 : maintenance CMS, sans pouvoir politique
        )
    );

-- Pour `niveau = 'cms'`, scope_commune_id reste NULL (la CMS est globale).
-- La contrainte droit_admin_scope_coherent existante l'enforce déjà
-- (scope_commune_id NOT NULL uniquement pour 'animation').

-- ============================================================================
-- RPC `peut_editer_cms()` : true si la personne courante a le droit
-- d'éditer les libellés CMS. C'est le cas pour :
--   - 'national' et 'admin' (qui ont déjà tous les droits)
--   - 'cms' (rôle dédié sans pouvoir politique)
--
-- Sœur de `est_admin_general()` (cf. migration 20260520120010_helpers.sql),
-- même pattern (SECURITY DEFINER, lecture seule).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.peut_editer_cms()
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.droit_admin
        WHERE personne_id = auth.uid()
          AND niveau IN ('national', 'admin', 'cms')
          AND retire_le IS NULL
    );
$$;

COMMENT ON FUNCTION public.peut_editer_cms() IS
    'True si la personne courante peut éditer les libellés CMS. Inclut national/admin (qui ont tout) et cms (rôle dédié). Cf. Master Plan §K.';

REVOKE EXECUTE ON FUNCTION public.peut_editer_cms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peut_editer_cms() TO authenticated;

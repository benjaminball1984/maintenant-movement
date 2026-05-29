-- ============================================================================
-- Chantier V2.5.22 — Master Plan V2.6 Phase H sous-chantier V2.5.10.d
--
-- Permettre à une personne de suivre un espace collectif comme elle suit
-- une autre personne. Symétrique de `relation_reseau` (suiveur_id ↔ suivi_id
-- entre personnes), mais pour les espaces.
--
-- Quand un compte suit un espace, les publications faites AU NOM de cet
-- espace (cf. V2.5.10 post_reseau.espace_*) montent dans le palier 1
-- de son flux transparent (au lieu de palier 2 « reste »).
--
-- Conforme à la doctrine de greffe : nouvelle table, aucune table touchée.
-- ============================================================================

CREATE TABLE IF NOT EXISTS abonnement_espace_reseau (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    suiveur_id    uuid NOT NULL REFERENCES public.personne(id) ON DELETE CASCADE,
    espace_type   text NOT NULL,
    espace_id     uuid NOT NULL,
    cree_le       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT abonnement_espace_type_valide
        CHECK (espace_type IN (
            'commune',
            'federation',
            'confederation',
            'gt_thematique',
            'groupe_entraide_local',
            'campagne'
        )),
    CONSTRAINT abonnement_espace_unique UNIQUE (suiveur_id, espace_type, espace_id)
);

COMMENT ON TABLE abonnement_espace_reseau IS
    'Abonnement d''une personne à un espace collectif. Les posts publiés au nom de l''espace remontent au palier "suivi·e" du flux transparent. Cf. CLAUDE.md §11 Master Plan V2.6 Phase H.';

CREATE INDEX IF NOT EXISTS abonnement_espace_par_suiveur_idx
    ON abonnement_espace_reseau (suiveur_id);
CREATE INDEX IF NOT EXISTS abonnement_espace_par_cible_idx
    ON abonnement_espace_reseau (espace_type, espace_id);

ALTER TABLE abonnement_espace_reseau ENABLE ROW LEVEL SECURITY;

-- Lecture publique : qui suit qui est une information ouverte (comme
-- relation_reseau qui est aussi public).
DROP POLICY IF EXISTS abonnement_espace_lecture ON abonnement_espace_reseau;
CREATE POLICY abonnement_espace_lecture ON abonnement_espace_reseau
    FOR SELECT
    USING (true);

-- Insertion : auth.uid() doit être suiveur_id (on ne peut suivre qu'au
-- nom de son propre compte).
DROP POLICY IF EXISTS abonnement_espace_insert_self ON abonnement_espace_reseau;
CREATE POLICY abonnement_espace_insert_self ON abonnement_espace_reseau
    FOR INSERT
    TO authenticated
    WITH CHECK (suiveur_id = auth.uid());

-- Suppression : auth.uid() doit être suiveur_id (se désabonner soi-même).
DROP POLICY IF EXISTS abonnement_espace_delete_self ON abonnement_espace_reseau;
CREATE POLICY abonnement_espace_delete_self ON abonnement_espace_reseau
    FOR DELETE
    TO authenticated
    USING (suiveur_id = auth.uid());

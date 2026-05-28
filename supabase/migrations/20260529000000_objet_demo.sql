-- ============================================================================
-- Chantier V2.5.1 — Master Plan V2.6 Phase A
-- Table polymorphe pour marquer les données de démonstration et permettre
-- leur suppression en un clic.
-- ============================================================================
--
-- Conforme à la doctrine de greffe (CLAUDE.md §0.3) : aucune table existante
-- n'est modifiée, on ne fait qu'ajouter une nouvelle table à côté. La
-- suppression de toute la démo se fait en lisant cette table puis en
-- supprimant ligne par ligne dans les tables d'origine (logique applicative
-- dans `lib/demo/marqueur.ts`), pas via un trigger BDD (les FK croisées
-- complexifieraient un DELETE CASCADE polymorphe).
--
-- Convention d'usage :
--   - `nom_table` : nom exact de la table (ex. 'personne', 'petition')
--   - `id_ligne`  : identifiant texte (UUID, slug, bigint stringifié, peu
--                   importe — on l'utilisera tel quel dans les DELETE
--                   ciblés par table)
--
-- Écriture réservée au service_role (scripts seed-demo + Server Action
-- admin "Supprimer la démo"). Lecture autorisée à tout authentifié pour
-- que l'UI admin puisse afficher les compteurs par table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS objet_demo (
    nom_table text NOT NULL,
    id_ligne  text NOT NULL,
    cree_le   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (nom_table, id_ligne)
);

COMMENT ON TABLE objet_demo IS
    'Marqueur polyvalent des données de démonstration. Cf. CLAUDE.md §11 (Master Plan V2.6 Phase A).';
COMMENT ON COLUMN objet_demo.nom_table IS
    'Nom exact de la table contenant la ligne marquée (ex. ''personne'', ''petition'').';
COMMENT ON COLUMN objet_demo.id_ligne IS
    'Identifiant textuel de la ligne marquée. Peut être un UUID stringifié, un slug, ou tout autre identifiant unique de la table cible.';

-- Index secondaire pour les compteurs par table (ex. "combien de personnes démo").
CREATE INDEX IF NOT EXISTS objet_demo_nom_table_idx ON objet_demo (nom_table);

-- RLS activée : aucune ligne ne fuit à un utilisateur final non admin.
ALTER TABLE objet_demo ENABLE ROW LEVEL SECURITY;

-- Lecture autorisée à tout utilisateur authentifié (utile pour l'UI admin
-- qui affiche les compteurs et la liste des objets démo).
DROP POLICY IF EXISTS objet_demo_lecture ON objet_demo;
CREATE POLICY objet_demo_lecture ON objet_demo
    FOR SELECT
    TO authenticated
    USING (true);

-- Pas de policy pour INSERT/UPDATE/DELETE : ces opérations passent
-- exclusivement par le service_role (scripts + Server Action admin national).

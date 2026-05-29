-- ============================================================================
-- Chantier V2.5.10 — Master Plan V2.6 Phase H : double visage
--                    réseau social / espace d'action
-- ============================================================================
--
-- Conforme à la doctrine de greffe (CLAUDE.md §0.3) : on AJOUTE deux
-- colonnes optionnelles à `post_reseau`, on ne supprime rien.
--
-- Principe : un `post_reseau` reste toujours attribué à une personne
-- (l'auteurice qui clique sur "Publier"), mais peut ÉGALEMENT être
-- publié AU NOM D'UN ESPACE COLLECTIF (commune, GT, groupe entraide,
-- campagne, fédération, confédération). Cela réalise le « double visage »
-- du Master Plan §H : l'espace d'action existe ET apparaît dans le flux
-- social, sans dupliquer la notion de page/groupe.
--
-- Schéma :
--   - `espace_type` : nul (= post personnel) ou nom de la table espace
--   - `espace_id`   : nul ou id de la ligne espace
--   - les deux doivent être nuls ou tous deux renseignés (CHECK)
--
-- Lecture côté flux :
--   - si `espace_type` est nul → post affiché comme aujourd'hui (au nom de l'auteurice)
--   - sinon → post affiché « par [Espace] » avec un sous-titre « publié par [auteurice] »
--
-- Permissions :
--   - INSERT avec `espace_type` réservé à un membre de l'espace ayant un
--     droit de publication (à durcir plus tard). Pour cette migration,
--     on contrôle uniquement la cohérence des colonnes ; la RLS et le
--     contrôle d'autorisation se feront au niveau applicatif (Server
--     Action `creerPostReseauEspace`).
-- ============================================================================

ALTER TABLE post_reseau
    ADD COLUMN IF NOT EXISTS espace_type text,
    ADD COLUMN IF NOT EXISTS espace_id uuid;

-- Liste fermée des types d'espaces qui peuvent publier dans le flux.
-- Identique à la liste utilisée par `bloc_espace` (V2.5.5).
ALTER TABLE post_reseau
    DROP CONSTRAINT IF EXISTS post_reseau_espace_type_valide;

ALTER TABLE post_reseau
    ADD CONSTRAINT post_reseau_espace_type_valide
    CHECK (
        espace_type IS NULL
        OR espace_type IN (
            'commune',
            'federation',
            'confederation',
            'gt_thematique',
            'groupe_entraide_local',
            'campagne'
        )
    );

-- Cohérence : les deux colonnes nulles ou les deux renseignées.
ALTER TABLE post_reseau
    DROP CONSTRAINT IF EXISTS post_reseau_espace_coherence;

ALTER TABLE post_reseau
    ADD CONSTRAINT post_reseau_espace_coherence
    CHECK (
        (espace_type IS NULL AND espace_id IS NULL)
        OR (espace_type IS NOT NULL AND espace_id IS NOT NULL)
    );

-- Index secondaire pour la requête « tous les posts publiés par un
-- espace donné », utilisée par la page de l'espace pour afficher son
-- propre flux d'historique.
CREATE INDEX IF NOT EXISTS post_reseau_espace_idx
    ON post_reseau (espace_type, espace_id, created_at DESC)
    WHERE espace_type IS NOT NULL;

COMMENT ON COLUMN post_reseau.espace_type IS
    'Si renseigné, le post est publié au nom de cet espace (commune, GT, etc.). Cf. CLAUDE.md §11 Master Plan V2.6 Phase H.';
COMMENT ON COLUMN post_reseau.espace_id IS
    'Id de la ligne dans la table désignée par espace_type. FK polymorphe non strictement enforced (cf. pattern reservation, bloc_espace).';

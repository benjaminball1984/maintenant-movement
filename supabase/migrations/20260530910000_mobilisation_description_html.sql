-- ============================================================================
-- Chantier V2.5.52 — Rich text sur la description des mobilisations
-- ============================================================================
--
-- Ajoute une colonne `description_html` nullable à `mobilisation` pour
-- permettre une description enrichie (couleurs, polices, listes,
-- citations, images, embeds vidéo).
--
-- Strictement additive, conforme à la doctrine de greffe (CLAUDE.md §0.3).
-- La colonne `description` (text) reste source de vérité historique et
-- compatible. Quand `description_html` est renseignée, la page publique
-- l'utilise en priorité (sanitizée au save).
-- ============================================================================

ALTER TABLE mobilisation
    ADD COLUMN IF NOT EXISTS description_html text;

COMMENT ON COLUMN mobilisation.description_html IS
    'Description de la mobilisation en HTML riche. Si renseigné, prend le pas sur description. Sanitization côté Server Action. Cf. V2.5.52.';

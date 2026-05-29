-- ============================================================================
-- Chantier V2.5.50 — Rich text sur la présentation des campagnes
-- ============================================================================
--
-- Ajoute une colonne `texte_html` nullable à `campagne` pour permettre
-- une présentation enrichie de la campagne (couleurs, polices, listes,
-- citations, images, embeds vidéo).
--
-- Strictement additive, conforme à la doctrine de greffe (CLAUDE.md §0.3).
-- La colonne `texte` reste source de vérité historique et compatible.
-- Quand `texte_html` est renseignée, la page publique l'utilise en
-- priorité (sanitizée au save via `lib/rich-text/sanitize.ts`).
-- ============================================================================

ALTER TABLE campagne
    ADD COLUMN IF NOT EXISTS texte_html text;

COMMENT ON COLUMN campagne.texte_html IS
    'Présentation de la campagne en HTML riche (couleurs, polices, listes, liens, embeds). Si renseigné, prend le pas sur texte. Sanitization côté Server Action. Cf. V2.5.50.';

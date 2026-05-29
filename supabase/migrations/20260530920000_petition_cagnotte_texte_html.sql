-- ============================================================================
-- Chantier V2.5.53 — Rich text sur les pétitions et cagnottes
-- ============================================================================
--
-- Ajoute une colonne `texte_html` nullable à `petition` ET `cagnotte`
-- pour permettre une présentation enrichie (couleurs, polices, listes,
-- citations, images, embeds vidéo).
--
-- Strictement additive, conforme à la doctrine de greffe (CLAUDE.md §0.3).
-- La colonne `texte` (text) reste source de vérité historique. Quand
-- `texte_html` est renseignée, la page publique l'utilise en priorité
-- (sanitizée au save).
-- ============================================================================

ALTER TABLE petition
    ADD COLUMN IF NOT EXISTS texte_html text;

COMMENT ON COLUMN petition.texte_html IS
    'Texte de la pétition en HTML riche. Si renseigné, prend le pas sur texte. Sanitization côté Server Action. Cf. V2.5.53.';

ALTER TABLE cagnotte
    ADD COLUMN IF NOT EXISTS texte_html text;

COMMENT ON COLUMN cagnotte.texte_html IS
    'Présentation de la cagnotte en HTML riche. Si renseigné, prend le pas sur texte. Sanitization côté Server Action. Cf. V2.5.53.';

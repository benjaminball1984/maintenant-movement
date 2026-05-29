-- ============================================================================
-- Chantier V2.5.33 — Rich text étendu au journal-affiche
-- ============================================================================
--
-- Ajoute une colonne `contenu_html` nullable à `journal_affiche` pour
-- stocker une version HTML riche du contenu d'une édition (couleurs,
-- polices, listes, images, citations, embeds vidéo).
--
-- Strictement additive, conforme à la doctrine de greffe (CLAUDE.md §0.3) :
-- `contenu_md` reste la source de vérité historique. Quand `contenu_html`
-- est renseignée, le rendu côté visiteur l'utilise en priorité (insérée
-- via dangerouslySetInnerHTML après sanitization au save).
--
-- La sanitization HTML se fait côté Server Action AVANT l'insertion en
-- base (réutilise `lib/rich-text/sanitize.ts`). En base on stocke du
-- HTML déjà propre, pas besoin de re-sanitize à la lecture.
-- ============================================================================

ALTER TABLE journal_affiche
    ADD COLUMN IF NOT EXISTS contenu_html text;

COMMENT ON COLUMN journal_affiche.contenu_html IS
    'HTML riche (couleurs, polices, listes, liens, images, embeds). Si renseigné, prend le pas sur contenu_md. Sanitization côté Server Action via lib/rich-text/sanitize.ts. Cf. V2.5.33.';

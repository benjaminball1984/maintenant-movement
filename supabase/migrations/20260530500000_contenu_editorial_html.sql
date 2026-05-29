-- ============================================================================
-- Chantier V2.5.23 — Rich text éditeur, fondations
-- ============================================================================
--
-- Ajoute une colonne `valeur_html` nullable à `contenu_editorial` pour stocker
-- une version HTML riche du contenu (couleurs, polices, tailles, listes,
-- liens, images, embeds). Strictement additive, conforme à la doctrine
-- de greffe (CLAUDE.md §0.3).
--
-- Quand `valeur_html` est renseignée, le rendu côté visiteur l'utilise en
-- priorité (insérée via `dangerouslySetInnerHTML` après sanitization au save).
-- Quand elle est nulle, fallback sur `valeur_md` (comportement actuel).
--
-- La sanitization HTML se fait côté Server Action AVANT l'insertion en base
-- (cf. `lib/rich-text/sanitize.ts`). En base on stocke du HTML déjà propre,
-- pas besoin de re-sanitize à la lecture.
-- ============================================================================

ALTER TABLE contenu_editorial
    ADD COLUMN IF NOT EXISTS valeur_html text;

COMMENT ON COLUMN contenu_editorial.valeur_html IS
    'HTML riche (couleurs, polices, listes, liens, images, embeds). Si renseigné, prend le pas sur valeur_md. Sanitization côté Server Action via lib/rich-text/sanitize.ts (allowlist stricte). Cf. CLAUDE.md §11 Master Plan V2.6 rich text.';

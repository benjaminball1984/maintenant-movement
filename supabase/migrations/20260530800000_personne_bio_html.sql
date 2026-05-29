-- ============================================================================
-- Chantier V2.5.49 — Bio rich text sur le profil personne
-- ============================================================================
--
-- Ajoute une colonne `bio_html` nullable à `personne` pour permettre une
-- bio enrichie (couleurs, polices, listes, liens, images, embeds).
--
-- Strictement additive, conforme à la doctrine de greffe (CLAUDE.md §0.3).
-- La colonne `bio` (max 500 chars en texte plat) reste source de vérité
-- historique et compatible. Quand `bio_html` est renseignée, le rendu
-- profil réseau l'utilise en priorité (déjà sanitizée au save via
-- `lib/rich-text/sanitize.ts`).
--
-- Limite : 20 000 caractères côté Server Action (Zod), assez pour une bio
-- enrichie de plusieurs paragraphes avec mise en forme et liens.
-- ============================================================================

ALTER TABLE personne
    ADD COLUMN IF NOT EXISTS bio_html text;

COMMENT ON COLUMN personne.bio_html IS
    'Bio en HTML riche (couleurs, polices, listes, liens, embeds). Si renseigné, prend le pas sur bio à l''affichage. Sanitization côté Server Action. Cf. V2.5.49.';

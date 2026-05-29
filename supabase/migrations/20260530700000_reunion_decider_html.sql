-- ============================================================================
-- Chantier V2.5.35 — Rich text étendu aux réunions Décider (OJ + PV)
-- ============================================================================
--
-- Ajoute deux colonnes nullable à `reunion_decider` pour stocker une version
-- HTML riche de l'ordre du jour (`ordre_jour_html`) et du procès-verbal
-- (`pv_html`). Strictement additive, conforme à la doctrine de greffe
-- (CLAUDE.md §0.3).
--
-- Quand ces colonnes sont renseignées, le rendu côté visiteur les utilise
-- en priorité (insérées via dangerouslySetInnerHTML après sanitization au
-- save côté Server Action via lib/rich-text/sanitize.ts).
--
-- Les colonnes `ordre_jour_md` et `pv_md` restent source de vérité historique
-- pour la rétrocompatibilité.
-- ============================================================================

ALTER TABLE reunion_decider
    ADD COLUMN IF NOT EXISTS ordre_jour_html text,
    ADD COLUMN IF NOT EXISTS pv_html text;

COMMENT ON COLUMN reunion_decider.ordre_jour_html IS
    'HTML riche de l''ordre du jour (couleurs, listes, citations, liens, embeds). Si renseigné, prend le pas sur ordre_jour_md. Sanitization côté Server Action. Cf. V2.5.35.';

COMMENT ON COLUMN reunion_decider.pv_html IS
    'HTML riche du procès-verbal (couleurs, listes, citations, liens, embeds). Si renseigné, prend le pas sur pv_md. Sanitization côté Server Action. Cf. V2.5.35.';

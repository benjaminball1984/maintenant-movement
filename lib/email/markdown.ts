/**
 * Conversion Markdown très léger → HTML compatible email (V2.5.20 — Master
 * Plan V2.6 Phase L sous-chantier V2.5.16.c).
 *
 * Permet aux templates CMS d'utiliser une syntaxe Markdown simple plutôt
 * que du HTML brut. Couvre les éléments essentiels d'un email transactionnel :
 *   - `**gras**` → `<strong>gras</strong>`
 *   - `*italique*` → `<em>italique</em>`
 *   - `[libellé](url)` → `<a href="url">libellé</a>` avec styles inline
 *   - lignes vides → paragraphes `<p>`
 *   - sauts de ligne simples → `<br>`
 *   - listes `- item` → `<ul><li>` (regroupées par blocs de lignes consécutives)
 *
 * Pas de support des en-têtes (#) ni des images ni des blocs de code : les
 * emails Maintenant! restent simples. Le gabarit `gabaritEmailHTML` gère
 * déjà la structure générale (bandeau, titre, pied).
 *
 * Pas de dépendance externe (regex simples). Sûr contre XSS : échappement
 * HTML des fragments texte AVANT application des transformations Markdown.
 */

const COULEUR_BRAND_EMAIL = '#7C3AED';

/** Échappe HTML : doit être appelé AVANT les transformations Markdown. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Échappe HTML mais réautorise les balises Markdown converties après. */
function appliquerInline(ligne: string): string {
  let s = escapeHtml(ligne);
  // Liens [texte](url) — avant gras/italique pour ne pas casser les URLs.
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, texte: string, url: string) =>
      `<a href="${url}" style="color:${COULEUR_BRAND_EMAIL};text-decoration:underline;">${texte}</a>`,
  );
  // Gras **texte**
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italique *texte* (après gras pour ne pas casser les **)
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return s;
}

/**
 * Convertit un contenu Markdown léger en HTML pour email.
 *
 * Stratégie :
 *   1. Split par double saut de ligne → paragraphes.
 *   2. Pour chaque paragraphe : détecter si c'est une liste (toutes les
 *      lignes commencent par `- `), sinon paragraphe normal avec `<br>`
 *      pour les sauts de ligne simples.
 *   3. Appliquer les transformations inline (gras, italique, liens) sur
 *      chaque ligne après échappement HTML.
 */
export function markdownEmail(contenu: string): string {
  const normalise = contenu.replace(/\r\n/g, '\n').trim();
  if (normalise === '') return '';

  const blocs = normalise.split(/\n\s*\n/);
  return blocs
    .map((bloc) => {
      const lignes = bloc.split('\n').map((l) => l.trimEnd());
      // Liste si toutes les lignes commencent par "- " (au moins 1)
      const estListe = lignes.length > 0 && lignes.every((l) => /^\s*-\s+/.test(l));
      if (estListe) {
        const items = lignes
          .map((l) => l.replace(/^\s*-\s+/, ''))
          .map((l) => `  <li style="margin:4px 0;">${appliquerInline(l)}</li>`)
          .join('\n');
        return `<ul style="margin:12px 0;padding-left:24px;">\n${items}\n</ul>`;
      }
      // Paragraphe normal : sauts de ligne simples → <br>
      const html = lignes.map((l) => appliquerInline(l)).join('<br>\n');
      return `<p style="margin:12px 0;line-height:1.6;">${html}</p>`;
    })
    .join('\n');
}

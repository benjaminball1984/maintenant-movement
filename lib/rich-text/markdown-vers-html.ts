/**
 * Convertisseur Markdown léger → HTML (V2.5.31).
 *
 * Permet de pré-remplir l'éditeur rich text TipTap avec le contenu
 * Markdown existant quand un admin bascule du mode Markdown au mode
 * Riche. Sans ce convertisseur, basculer = repartir d'une page vide,
 * ce qui est une perte de contenu inattendue.
 *
 * Couvre les mêmes cas que `MarkdownLeger` (composant React) :
 *  - Titres `## ` → `<h2>` et `### ` → `<h3>`
 *  - Listes `- item` → `<ul><li>item</li></ul>` (groupées)
 *  - Paragraphes séparés par lignes vides → `<p>...</p>`
 *  - Inline : `**gras**` → `<strong>`, `*italique*` → `<em>`
 *
 * Le résultat est ensuite RE-sanitizé côté Server Action via
 * `sanitizeRichHtml` avant insertion en base. Donc même si la
 * conversion produit quelque chose de bizarre, ça ne peut pas
 * sortir de l'allowlist.
 *
 * Pas de dépendance externe (cohérent avec le choix de `MarkdownLeger`).
 * Si un jour on a besoin de tableaux / code blocks / lien hypertexte,
 * basculer sur `marked` ou `remark`.
 */

/**
 * Convertit un texte Markdown léger en HTML compatible TipTap.
 * Le HTML est minimal (pas de class CSS, pas d'attributs au-delà de
 * la sémantique) pour que TipTap l'interprète correctement et que le
 * sanitize aval n'ait rien à supprimer.
 */
export function markdownLegerEnHtml(texte: string): string {
  if (texte.trim() === '') return '';

  const lignes = texte.split('\n');
  const blocs: string[] = [];
  let i = 0;

  while (i < lignes.length) {
    const ligne = lignes[i] ?? '';

    // Titre ##
    if (ligne.startsWith('## ')) {
      blocs.push(`<h2>${inline(echapper(ligne.slice(3)))}</h2>`);
      i += 1;
      continue;
    }
    // Titre ###
    if (ligne.startsWith('### ')) {
      blocs.push(`<h3>${inline(echapper(ligne.slice(4)))}</h3>`);
      i += 1;
      continue;
    }
    // Liste : groupe toutes les lignes `- ` consécutives
    if (ligne.startsWith('- ')) {
      const items: string[] = [];
      while (i < lignes.length && (lignes[i] ?? '').startsWith('- ')) {
        items.push(`<li>${inline(echapper((lignes[i] ?? '').slice(2)))}</li>`);
        i += 1;
      }
      blocs.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    // Ligne vide : séparateur
    if (ligne.trim() === '') {
      i += 1;
      continue;
    }
    // Paragraphe : accumule lignes jusqu'à ligne vide ou bloc
    const paraLignes: string[] = [ligne];
    i += 1;
    while (
      i < lignes.length &&
      (lignes[i] ?? '').trim() !== '' &&
      !(lignes[i] ?? '').startsWith('## ') &&
      !(lignes[i] ?? '').startsWith('### ') &&
      !(lignes[i] ?? '').startsWith('- ')
    ) {
      paraLignes.push(lignes[i] ?? '');
      i += 1;
    }
    blocs.push(`<p>${inline(echapper(paraLignes.join(' ')))}</p>`);
  }

  return blocs.join('');
}

/**
 * Échappe `<`, `>`, `&` pour éviter d'injecter du HTML brut depuis le
 * Markdown. L'inline formatting (**, *) est appliqué APRÈS l'échappement,
 * donc les balises <strong> / <em> qu'on ajoute ne sont pas réechappées.
 */
function echapper(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Inline formatting : `**gras**` → `<strong>gras</strong>`, `*italique*`
 * → `<em>italique</em>`. On match `**...**` AVANT `*...*` pour éviter
 * que `**` soit interprété comme deux `*` imbriqués.
 */
function inline(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
}

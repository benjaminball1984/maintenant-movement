import type { ReactNode } from 'react';

/**
 * Mini-rendu Markdown sans dépendance externe (V2.4.16, extrait
 * de ContenuEditableAdmin V2.4.1 pour réutilisation).
 *
 * Couvre les cas usuels :
 * - titres `## ` et `### `
 * - listes `- `
 * - paragraphes séparés par lignes vides
 * - gras `**texte**`, italique `*texte*`
 *
 * Suffisant pour un CMS de pages éditoriales et le contenu du
 * journal-affiche. Si un besoin plus riche émerge (tableaux, images,
 * liens hypertextes, citations, code), basculer sur `remark`+`react-markdown`.
 */
export function MarkdownLeger({ texte }: { texte: string }) {
  if (texte.trim() === '') return null;

  const lignes = texte.split('\n');
  const blocs: ReactNode[] = [];
  let i = 0;
  let cleBloc = 0;

  while (i < lignes.length) {
    const ligne = lignes[i] ?? '';

    // Titre ##
    if (ligne.startsWith('## ')) {
      blocs.push(
        <h2 key={`b${cleBloc++}`} className="mt-6 mb-2 font-display font-bold text-text-1 text-xl">
          {inline(ligne.slice(3))}
        </h2>,
      );
      i += 1;
      continue;
    }
    // Titre ###
    if (ligne.startsWith('### ')) {
      blocs.push(
        <h3 key={`b${cleBloc++}`} className="mt-4 mb-2 font-bold text-lg text-text-1">
          {inline(ligne.slice(4))}
        </h3>,
      );
      i += 1;
      continue;
    }
    // Liste
    if (ligne.startsWith('- ')) {
      const items: string[] = [];
      while (i < lignes.length && (lignes[i] ?? '').startsWith('- ')) {
        items.push((lignes[i] ?? '').slice(2));
        i += 1;
      }
      blocs.push(
        <ul key={`b${cleBloc++}`} className="my-2 ml-5 list-disc space-y-1 text-text-1">
          {items.map((it) => (
            <li key={`li-${it.slice(0, 30)}`}>{inline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    // Ligne vide
    if (ligne.trim() === '') {
      i += 1;
      continue;
    }
    // Paragraphe (accumule lignes jusqu'à ligne vide ou bloc)
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
    blocs.push(
      <p key={`b${cleBloc++}`} className="my-2 text-text-1">
        {inline(paraLignes.join(' '))}
      </p>,
    );
  }

  return <>{blocs}</>;
}

/** Inline formatting : **gras** et *italique*. Simple, suffisant. */
function inline(s: string): ReactNode {
  const tokens: ReactNode[] = [];
  const reste = s;
  let key = 0;
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIdx = 0;
  for (const match of reste.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > lastIdx) tokens.push(reste.slice(lastIdx, idx));
    if (match[1] !== undefined) {
      tokens.push(<strong key={`s${key++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      tokens.push(<em key={`e${key++}`}>{match[2]}</em>);
    }
    lastIdx = idx + match[0].length;
  }
  if (lastIdx < reste.length) tokens.push(reste.slice(lastIdx));
  return <>{tokens}</>;
}

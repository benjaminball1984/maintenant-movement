import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';

/**
 * Composant de rendu d'un contenu CMS qui peut être HTML riche OU markdown
 * léger (V2.5.23 — Master Plan rich text).
 *
 * Si `valeurHtml` est renseignée, le composant insère directement le HTML
 * via `dangerouslySetInnerHTML` (déjà sanitizé au save par le Server
 * Action, cf. `lib/rich-text/sanitize.ts`).
 *
 * Sinon, fallback sur `MarkdownLeger` qui parse `valeurMd` (gras + liens
 * basiques).
 *
 * Server Component : aucun runtime client, aucun JS embarqué.
 *
 * Classes typographiques par défaut : `prose` simulé via Tailwind arbitrary
 * selectors pour aérer les paragraphes, titres, listes, citations, liens.
 * Surchargeable via `className`.
 */

interface RenduRicheProps {
  valeurHtml?: string | null;
  valeurMd?: string | null;
  className?: string;
}

const CLASSES_TYPO_DEFAUT =
  'max-w-none [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:my-1 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:mt-3 [&_h4]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:brightness-110 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-3 [&_iframe]:max-w-full [&_iframe]:my-4 [&_iframe]:rounded-md [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1 [&_th]:bg-surface-2 [&_th]:font-bold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1 [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:my-3 [&_pre]:overflow-x-auto [&_hr]:my-6 [&_hr]:border-border';

export function RenduRiche({ valeurHtml, valeurMd, className }: RenduRicheProps) {
  const classes = `${CLASSES_TYPO_DEFAUT} ${className ?? ''}`;

  // Priorité : HTML riche si présent, sinon Markdown léger.
  if (valeurHtml !== null && valeurHtml !== undefined && valeurHtml.trim() !== '') {
    return (
      <div
        className={classes}
        // Le HTML est déjà sanitizé côté Server Action au save
        // (cf. lib/rich-text/sanitize.ts > sanitizeRichHtml).
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <HTML pré-sanitizé en base>
        dangerouslySetInnerHTML={{ __html: valeurHtml }}
      />
    );
  }

  if (valeurMd !== null && valeurMd !== undefined && valeurMd.trim() !== '') {
    return (
      <div className={classes}>
        <MarkdownLeger texte={valeurMd} />
      </div>
    );
  }

  return null;
}

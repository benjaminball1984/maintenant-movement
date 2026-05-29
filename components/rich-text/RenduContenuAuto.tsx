import { RenduRiche } from '@/components/rich-text/RenduRiche';
import { lireContenuEditorial } from '@/lib/contenu-editorial';

/**
 * Server Component qui LIT une clé `contenu_editorial` et la rend
 * automatiquement en HTML riche (priorité) ou Markdown léger (V2.5.45).
 *
 * Wrapper de commodité au-dessus de `RenduRiche` qui évite de
 * dupliquer le pattern `lireContenuEditorial` + choix md/html dans
 * chaque page. À utiliser quand on veut juste afficher un contenu CMS
 * sans avoir besoin d'éditer en place (pour ça, utiliser
 * `ContenuEditableAdmin`).
 *
 * Usage typique :
 *   <RenduContenuAuto
 *     cle="comprendre.doctrine.intro"
 *     fallbackMd="Lorem ipsum..."
 *   />
 *
 * Si la clé n'existe pas en base, on rend le fallbackMd via Markdown
 * léger (comportement de `lireContenuEditorial`). Si la clé existe et
 * a une version HTML riche, c'est elle qui est rendue.
 */

interface RenduContenuAutoProps {
  /** Clé CMS (ex. `home.intro`). */
  cle: string;
  /** Fallback Markdown si la clé n'existe pas encore en base. */
  fallbackMd: string;
  /** Classes CSS additionnelles passées à `RenduRiche`. */
  className?: string;
}

export async function RenduContenuAuto({ cle, fallbackMd, className }: RenduContenuAutoProps) {
  const contenu = await lireContenuEditorial(cle, { valeurMd: fallbackMd });
  return (
    <RenduRiche valeurHtml={contenu.valeurHtml} valeurMd={contenu.valeurMd} className={className} />
  );
}

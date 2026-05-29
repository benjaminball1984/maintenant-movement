'use client';

import { mettreAJourContenuEditorialAction } from '@/app/actions/contenu-editorial';
import { EditeurRicheAvecToolbar } from '@/components/rich-text/EditeurRicheAvecToolbar';
import { Button } from '@/components/ui';
import { Check, FileText, Pencil, Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MarkdownLeger } from './MarkdownLeger';

/**
 * Composant universel d'affichage d'un contenu éditorial avec édition
 * inline pour les admins (CMS V2.4.1, mode rich text ajouté V2.5.23).
 *
 * Côté visiteur :
 *   - Si `valeurHtmlInitiale` est non vide : rendu HTML riche
 *     (déjà sanitizé au save, on injecte via dangerouslySetInnerHTML).
 *   - Sinon : rendu Markdown léger (titres, listes, gras, italique).
 *
 * Côté admin (`estAdmin=true`) : ajoute un bouton « Modifier » qui
 * ouvre un éditeur inline avec choix de mode :
 *   - Mode Markdown : textarea (compatible historique, simple).
 *   - Mode Riche : éditeur WYSIWYG TipTap avec toolbar complète
 *     (couleurs, polices, listes, citations, alignement, liens,
 *     images, embed YouTube, undo/redo).
 *
 * Le serveur ne reçoit que le champ qu'on a édité (md ou html), il
 * conserve l'autre tel quel. Permet de coexister sans tout migrer.
 */

interface Props {
  cle: string;
  valeurInitiale: string;
  /** V2.5.23 — HTML riche optionnel. Si présent, prime sur Markdown. */
  valeurHtmlInitiale?: string | null;
  estAdmin: boolean;
  titre?: string;
  /** Classes CSS additionnelles pour le rendu lecture. */
  className?: string;
  /** Si true, place le bouton « Modifier » à droite du titre plutôt qu'en
   * haut. Utile pour les blocs courts. */
  editionCompacte?: boolean;
}

type ModeEdition = 'markdown' | 'riche';

export function ContenuEditableAdmin({
  cle,
  valeurInitiale,
  valeurHtmlInitiale = null,
  estAdmin,
  titre,
  className,
  editionCompacte = false,
}: Props) {
  const chemin = usePathname();
  const [enEdition, setEnEdition] = useState(false);
  const [mode, setMode] = useState<ModeEdition>(
    valeurHtmlInitiale !== null && valeurHtmlInitiale !== '' ? 'riche' : 'markdown',
  );
  const [valeurMd, setValeurMd] = useState(valeurInitiale);
  const [valeurHtml, setValeurHtml] = useState(valeurHtmlInitiale ?? '');
  const [mdEnregistre, setMdEnregistre] = useState(valeurInitiale);
  const [htmlEnregistre, setHtmlEnregistre] = useState<string | null>(valeurHtmlInitiale);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surEnregistrer = async (): Promise<void> => {
    setEnCours(true);
    setErreur(null);
    // On envoie le champ qu'on vient d'éditer ; l'autre est préservé
    // côté serveur (lecture-update partielle dans la Server Action).
    const payload =
      mode === 'riche'
        ? { cle, titre, valeurHtml, cheminRevalidation: chemin }
        : { cle, titre, valeurMd, cheminRevalidation: chemin };
    const r = await mettreAJourContenuEditorialAction(payload);
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    if (mode === 'riche') {
      setHtmlEnregistre(valeurHtml === '' ? null : valeurHtml);
    } else {
      setMdEnregistre(valeurMd);
    }
    setEnEdition(false);
  };

  const surAnnuler = (): void => {
    setValeurMd(mdEnregistre);
    setValeurHtml(htmlEnregistre ?? '');
    setEnEdition(false);
    setErreur(null);
  };

  const surBasculerMode = (nouveauMode: ModeEdition): void => {
    setMode(nouveauMode);
    setErreur(null);
  };

  const surEffacerRiche = (): void => {
    setValeurHtml('');
  };

  if (enEdition) {
    return (
      <div className="grid gap-3 rounded-md border border-brand bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">
            Édition admin · clé <code className="font-mono">{cle}</code>
          </p>
          <div className="ml-auto inline-flex overflow-hidden rounded-md border border-border text-xs">
            <button
              type="button"
              onClick={() => surBasculerMode('riche')}
              className={`inline-flex items-center gap-1 px-3 py-1 ${
                mode === 'riche' ? 'bg-brand text-white' : 'bg-surface text-text-2'
              }`}
              aria-pressed={mode === 'riche'}
            >
              <Sparkles size={12} aria-hidden="true" />
              Mode riche
            </button>
            <button
              type="button"
              onClick={() => surBasculerMode('markdown')}
              className={`inline-flex items-center gap-1 border-border border-l px-3 py-1 ${
                mode === 'markdown' ? 'bg-brand text-white' : 'bg-surface text-text-2'
              }`}
              aria-pressed={mode === 'markdown'}
            >
              <FileText size={12} aria-hidden="true" />
              Markdown
            </button>
          </div>
        </div>

        {mode === 'riche' ? (
          <div className="grid gap-2">
            <EditeurRicheAvecToolbar
              contenuInitialHtml={valeurHtml}
              onChange={setValeurHtml}
              placeholder="Rédige ton contenu (couleurs, polices, listes, liens, images, YouTube…)"
              hauteurMin={300}
            />
            <div className="flex items-center justify-between text-text-3 text-xs">
              <p>
                Couleurs, polices, listes, citations, liens, images et YouTube disponibles via la
                toolbar. Sanitization au save (anti-XSS).
              </p>
              {valeurHtml !== '' ? (
                <button
                  type="button"
                  onClick={surEffacerRiche}
                  className="text-danger hover:underline"
                >
                  Vider le HTML riche (retour Markdown)
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={valeurMd}
              onChange={(e) => setValeurMd(e.target.value)}
              rows={Math.max(8, valeurMd.split('\n').length + 2)}
              maxLength={50000}
              className="w-full rounded-md border border-border bg-surface p-2 font-mono text-sm text-text-1"
            />
            <p className="text-text-3 text-xs">
              Markdown léger : titres <code>##</code>, listes <code>-</code>, gras{' '}
              <code>**texte**</code>, italique <code>*texte*</code>.{' '}
              <span className="ml-auto">{valeurMd.length} / 50 000</span>
            </p>
          </>
        )}

        <div className="flex items-center gap-2">
          <Button taille="sm" onClick={surEnregistrer} disabled={enCours}>
            <Check size={14} aria-hidden="true" />
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button variant="ghost" taille="sm" onClick={surAnnuler} disabled={enCours}>
            <X size={14} aria-hidden="true" />
            Annuler
          </Button>
        </div>
        {erreur !== null && (
          <p role="alert" className="text-danger text-sm">
            {erreur}
          </p>
        )}
      </div>
    );
  }

  // Affichage visiteur (et admin hors édition). Si le HTML riche est posé,
  // on l'utilise (déjà sanitizé au save). Sinon, fallback Markdown léger.
  const rendreContenu = (): JSX.Element =>
    htmlEnregistre !== null && htmlEnregistre.trim() !== '' ? (
      <div
        className="prose prose-sm max-w-none [&_a]:text-brand [&_a]:underline [&_blockquote]:border-brand [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h1]:mt-4 [&_h1]:font-bold [&_h1]:text-2xl [&_h2]:mt-3 [&_h2]:font-bold [&_h2]:text-xl [&_h3]:mt-2 [&_h3]:font-bold [&_h3]:text-lg [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML déjà sanitizé côté Server Action via sanitizeRichHtml
        dangerouslySetInnerHTML={{ __html: htmlEnregistre }}
      />
    ) : (
      <MarkdownLeger texte={mdEnregistre} />
    );

  return (
    <div className={`group relative ${className ?? ''}`}>
      {estAdmin ? (
        <button
          type="button"
          onClick={() => setEnEdition(true)}
          className={`${editionCompacte ? 'absolute top-0 right-0' : 'mb-2'} inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-text-3 text-xs opacity-0 transition-opacity hover:bg-surface-2 hover:text-text-1 group-hover:opacity-100`}
          aria-label={`Modifier le contenu « ${cle} » (admin)`}
        >
          <Pencil size={12} aria-hidden="true" />
          Modifier
        </button>
      ) : null}
      {rendreContenu()}
    </div>
  );
}

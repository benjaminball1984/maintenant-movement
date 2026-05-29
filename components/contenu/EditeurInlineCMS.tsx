'use client';

import { mettreAJourContenuEditorialAction } from '@/app/actions/contenu-editorial';
import { EditeurRicheAvecToolbar } from '@/components/rich-text/EditeurRicheAvecToolbar';
import { Alert, Button, Textarea } from '@/components/ui';
import { markdownLegerEnHtml } from '@/lib/rich-text/markdown-vers-html';
import { Check, Edit2, FileText, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface EditeurInlineCMSProps {
  cle: string;
  valeurInitiale: string;
  /** V2.5.25 — valeur HTML riche initiale (optionnelle). */
  valeurHtmlInitiale?: string | null;
  /** Chemin à revalider après sauvegarde (optionnel). */
  cheminRevalidation?: string;
  /** Callback appelé après sauvegarde réussie avec la nouvelle valeur. */
  onSauvegarde?: (nouvelleValeur: string) => void;
}

type ModeEdition = 'markdown' | 'riche';

/**
 * Éditeur inline pour la console CMS (V2.5.21 — sous-chantier V2.5.15.b,
 * étendu V2.5.25 avec le mode rich text).
 *
 * Affiche un bouton « ✎ Éditer » en mode lecture. Au clic, déplie un
 * éditeur avec choix de mode :
 *   - Mode Markdown : textarea simple (historique, compatible).
 *   - Mode Riche : éditeur WYSIWYG TipTap (couleurs, polices, listes,
 *     liens, images, embed YouTube) — utile pour les blocs longs et les
 *     corps d'emails (la clé `email.{type}.html` est ensuite consommée
 *     prioritairement par `envoyerEmailTemplee` si renseignée).
 *
 * Le serveur ne reçoit que le champ qu'on a édité (md OU html), l'autre
 * est préservé en base. Au succès, replie et affiche un feedback bref.
 *
 * Pas de preview avant publication pour cette V2.5.21 — c'est V2.5.15.c
 * (mode brouillon) qui ajoutera ça. Pour l'instant la sauvegarde est
 * immédiate (la console CMS étant accessible uniquement aux admins +
 * CMS, le risque d'erreur publique est borné).
 */
export function EditeurInlineCMS({
  cle,
  valeurInitiale,
  valeurHtmlInitiale = null,
  cheminRevalidation,
  onSauvegarde,
}: EditeurInlineCMSProps) {
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<ModeEdition>(
    valeurHtmlInitiale !== null && valeurHtmlInitiale !== '' ? 'riche' : 'markdown',
  );
  const [valeurMd, setValeurMd] = useState(valeurInitiale);
  const [valeurHtml, setValeurHtml] = useState(valeurHtmlInitiale ?? '');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  function ouvrir() {
    setValeurMd(valeurInitiale);
    setValeurHtml(valeurHtmlInitiale ?? '');
    setMode(valeurHtmlInitiale !== null && valeurHtmlInitiale !== '' ? 'riche' : 'markdown');
    setErreur(null);
    setSucces(false);
    setOuvert(true);
  }

  function annuler() {
    setValeurMd(valeurInitiale);
    setValeurHtml(valeurHtmlInitiale ?? '');
    setOuvert(false);
    setErreur(null);
  }

  async function sauvegarder() {
    setErreur(null);
    setSucces(false);
    setEnCours(true);
    const payload =
      mode === 'riche'
        ? { cle, valeurHtml, cheminRevalidation }
        : { cle, valeurMd, cheminRevalidation };
    const r = await mettreAJourContenuEditorialAction(payload);
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(true);
    // Le callback ne reçoit que le markdown pour préserver la signature
    // historique du composant. Si le mode est riche, on passe la version
    // markdown actuelle (inchangée) ; la liste parent fait son re-render
    // via revalidation Next ensuite.
    onSauvegarde?.(valeurMd);
    setTimeout(() => {
      setSucces(false);
      setOuvert(false);
    }, 1200);
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={ouvrir}
        className="inline-flex items-center gap-1 text-brand text-xs hover:underline"
      >
        <Edit2 size={11} strokeWidth={1.5} aria-hidden="true" />
        Éditer ici
      </button>
    );
  }

  return (
    <div className="mt-2 grid gap-2 rounded-md border border-brand/30 bg-brand-light/30 p-3">
      <div className="flex items-center justify-end">
        <div className="inline-flex overflow-hidden rounded-md border border-border text-xs">
          <button
            type="button"
            onClick={() => {
              // V2.5.31 : si on bascule vers Riche et que le HTML est vide,
              // pre-remplir avec la conversion du Markdown courant pour ne
              // pas perdre le contenu de l'admin.
              if (valeurHtml === '' && valeurMd.trim() !== '') {
                setValeurHtml(markdownLegerEnHtml(valeurMd));
              }
              setMode('riche');
              setErreur(null);
            }}
            className={`inline-flex items-center gap-1 px-3 py-1 ${
              mode === 'riche' ? 'bg-brand text-white' : 'bg-surface text-text-2'
            }`}
            aria-pressed={mode === 'riche'}
          >
            <Sparkles size={11} aria-hidden="true" />
            Riche
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('markdown');
              setErreur(null);
            }}
            className={`inline-flex items-center gap-1 border-border border-l px-3 py-1 ${
              mode === 'markdown' ? 'bg-brand text-white' : 'bg-surface text-text-2'
            }`}
            aria-pressed={mode === 'markdown'}
          >
            <FileText size={11} aria-hidden="true" />
            Markdown
          </button>
        </div>
      </div>
      {erreur !== null ? (
        <Alert variant="danger" titre="Sauvegarde impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Enregistré">
          Modification publiée.
        </Alert>
      ) : null}
      {mode === 'riche' ? (
        <EditeurRicheAvecToolbar
          contenuInitialHtml={valeurHtml}
          onChange={setValeurHtml}
          placeholder="Rédige ton contenu (couleurs, polices, listes, liens, images, YouTube…)"
          hauteurMin={220}
        />
      ) : (
        <Textarea
          value={valeurMd}
          onChange={(e) => setValeurMd(e.target.value)}
          rows={Math.min(10, Math.max(3, valeurMd.split('\n').length))}
          className="resize-y bg-surface font-mono text-xs"
          maxLength={50000}
          aria-label={`Édition de ${cle}`}
        />
      )}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-text-3">
          {mode === 'riche' ? `${valeurHtml.length} car.` : `${valeurMd.length}/50000`}
        </span>
        <div className="flex gap-2">
          <Button onClick={annuler} variant="ghost" taille="sm" type="button" disabled={enCours}>
            <X size={12} strokeWidth={1.5} className="mr-1" aria-hidden="true" />
            Annuler
          </Button>
          <Button onClick={sauvegarder} taille="sm" type="button" disabled={enCours}>
            <Check size={12} strokeWidth={1.5} className="mr-1" aria-hidden="true" />
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

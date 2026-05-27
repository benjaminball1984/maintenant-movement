'use client';

import { mettreAJourContenuEditorialAction } from '@/app/actions/contenu-editorial';
import { Button } from '@/components/ui';
import { Check, Pencil, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MarkdownLeger } from './MarkdownLeger';

/**
 * Composant universel d'affichage d'un contenu éditorial avec bouton
 * d'édition inline pour les admins (CMS V2.4.1).
 *
 * Côté visiteur : rend le `valeurInitiale` en texte (Markdown léger
 * géré inline ; sauts de ligne respectés).
 * Côté admin (`estAdmin=true`) : ajoute un bouton « ✏️ Modifier »
 * qui ouvre un éditeur inline (textarea pleine largeur + sauver/annuler).
 *
 * La détection admin se fait côté serveur dans le composant parent qui
 * fournit la prop `estAdmin`. Le rendu Markdown léger est intentionnel
 * (pas de lib externe) : titres `## ` et `### `, listes `- `,
 * paragraphes séparés par lignes vides, gras `**`, italique `*`.
 */

interface Props {
  cle: string;
  valeurInitiale: string;
  estAdmin: boolean;
  titre?: string;
  /** Classes CSS additionnelles pour le rendu lecture. */
  className?: string;
  /** Si true, place le bouton « Modifier » à droite du titre plutôt qu'en
   * haut. Utile pour les blocs courts. */
  editionCompacte?: boolean;
}

export function ContenuEditableAdmin({
  cle,
  valeurInitiale,
  estAdmin,
  titre,
  className,
  editionCompacte = false,
}: Props) {
  const chemin = usePathname();
  const [enEdition, setEnEdition] = useState(false);
  const [valeur, setValeur] = useState(valeurInitiale);
  const [enregistre, setEnregistre] = useState(valeurInitiale);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surEnregistrer = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await mettreAJourContenuEditorialAction({
      cle,
      valeurMd: valeur,
      titre,
      cheminRevalidation: chemin,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setEnregistre(valeur);
    setEnEdition(false);
  };

  const surAnnuler = () => {
    setValeur(enregistre);
    setEnEdition(false);
    setErreur(null);
  };

  if (enEdition) {
    return (
      <div className="grid gap-2 rounded-md border border-brand bg-surface p-3">
        <p className="font-bold text-text-3 text-xs uppercase tracking-cap">
          Édition admin · clé <code className="font-mono">{cle}</code>
        </p>
        <textarea
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          rows={Math.max(8, valeur.split('\n').length + 2)}
          maxLength={50000}
          className="w-full rounded-md border border-border bg-surface p-2 font-mono text-sm text-text-1"
        />
        <div className="flex items-center gap-2">
          <Button taille="sm" onClick={surEnregistrer} disabled={enCours}>
            <Check size={14} aria-hidden="true" />
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button variant="ghost" taille="sm" onClick={surAnnuler} disabled={enCours}>
            <X size={14} aria-hidden="true" />
            Annuler
          </Button>
          <p className="ml-auto text-text-3 text-xs">{valeur.length} / 50 000</p>
        </div>
        {erreur !== null && (
          <p role="alert" className="text-danger text-sm">
            {erreur}
          </p>
        )}
      </div>
    );
  }

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
      <MarkdownLeger texte={enregistre} />
    </div>
  );
}

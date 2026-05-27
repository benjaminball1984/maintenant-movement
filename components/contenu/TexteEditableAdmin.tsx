'use client';

import { mettreAJourContenuEditorialAction } from '@/app/actions/contenu-editorial';
import { Button } from '@/components/ui';
import { Check, Pencil, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';

/**
 * Composant inline d'édition d'un texte court (V2.4.104).
 *
 * Variante légère de `ContenuEditableAdmin` (V2.4.1) pour les libellés
 * courts (titre, sous-titre, surtitre, libellé bouton, microcopie).
 * Pas de rendu Markdown : le texte brut est passé au composant enfant
 * sous forme de string.
 *
 * Usage :
 *   <TexteEditableAdmin cle="home.surtitre" valeurInitiale="..." estAdmin={estAdmin}>
 *     {(texte) => <p className="...">{texte}</p>}
 *   </TexteEditableAdmin>
 *
 * Côté visiteur : rend `children(valeurEnregistree)` (donc apparence
 * 100 % décidée par le parent). Côté admin : ajoute un bouton « ✏️ »
 * en surimpression coin haut-droit, qui ouvre un input/textarea inline
 * pour modifier la valeur.
 *
 * Persistance via `contenu_editorial` (clé/valeur). La valeur est lue
 * par le Server Component parent via `lireContenuEditorial()`.
 */

export interface TexteEditableAdminProps {
  /** Clé unique du contenu (ex. 'home.surtitre'). */
  cle: string;
  /** Valeur actuelle (depuis la base ou fallback). */
  valeurInitiale: string;
  /** True si l'utilisateurice connectée est admin. */
  estAdmin: boolean;
  /** Rendu enfant qui reçoit la valeur courante en argument. */
  children: (valeur: string) => ReactNode;
  /** Si true, utilise <textarea> au lieu de <input> en mode édition. */
  multilignes?: boolean;
  /** Longueur max acceptée (défaut 500). */
  longueurMax?: number;
  /** Label décrivant ce qu'on édite (pour l'aria-label). */
  libelle?: string;
}

export function TexteEditableAdmin({
  cle,
  valeurInitiale,
  estAdmin,
  children,
  multilignes = false,
  longueurMax = 500,
  libelle,
}: TexteEditableAdminProps) {
  const chemin = usePathname();
  const [enEdition, setEnEdition] = useState(false);
  const [valeur, setValeur] = useState(valeurInitiale);
  const [enregistre, setEnregistre] = useState(valeurInitiale);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surEnregistrer = async (): Promise<void> => {
    setEnCours(true);
    setErreur(null);
    const r = await mettreAJourContenuEditorialAction({
      cle,
      valeurMd: valeur,
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

  const surAnnuler = (): void => {
    setValeur(enregistre);
    setEnEdition(false);
    setErreur(null);
  };

  if (enEdition) {
    return (
      // Le `onClick` qui arrete la propagation est crucial quand ce composant
      // est rendu a l'interieur d'un `<Link>` (cartes des pages hub) : sans
      // ca, chaque clic sur l'input / le bouton remonterait au lien et
      // declencherait une navigation.
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
        className="my-2 grid gap-2 rounded-md border-2 border-brand bg-surface p-3 text-left"
      >
        <p className="font-bold text-text-3 text-xs uppercase tracking-cap">
          Édition · <code className="font-mono">{cle}</code>
        </p>
        {multilignes ? (
          <textarea
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            rows={Math.max(3, valeur.split('\n').length + 1)}
            maxLength={longueurMax}
            className="w-full rounded-md border border-border bg-surface p-2 font-body text-sm text-text-1"
            aria-label={libelle ?? `Modifier ${cle}`}
          />
        ) : (
          <input
            type="text"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            maxLength={longueurMax}
            className="w-full rounded-md border border-border bg-surface p-2 font-body text-sm text-text-1"
            aria-label={libelle ?? `Modifier ${cle}`}
          />
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
          <p className="ml-auto text-text-3 text-xs">
            {valeur.length} / {longueurMax}
          </p>
        </div>
        {erreur !== null && (
          <p role="alert" className="text-danger text-sm">
            {erreur}
          </p>
        )}
      </div>
    );
  }

  if (!estAdmin) {
    return <>{children(enregistre)}</>;
  }

  return (
    <span className="group relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          // Coupe la propagation pour eviter qu'un eventuel `<Link>` parent
          // (cartes des pages hub) ne navigue quand l'admin clique le crayon.
          e.preventDefault();
          e.stopPropagation();
          setEnEdition(true);
        }}
        className="-top-2 -right-2 absolute z-20 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-text-3 text-xs opacity-0 shadow-md transition-opacity hover:bg-surface-2 hover:text-text-1 group-hover:opacity-100"
        aria-label={`Modifier ${libelle ?? cle}`}
      >
        <Pencil size={12} aria-hidden="true" />
      </button>
      {children(enregistre)}
    </span>
  );
}

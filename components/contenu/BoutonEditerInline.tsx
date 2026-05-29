'use client';

import { mettreAJourContenuEditorialAction } from '@/app/actions/contenu-editorial';
import { Button } from '@/components/ui';
import { Check, Pencil, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Bouton overlay « ✏️ Modifier » pour `TexteEditableAdmin` (V2.5.22).
 *
 * Refonte du composant historique en server-wrapper (le wrapper appelle
 * `children(valeur)`) + client-overlay (ce composant) pour éviter l'erreur
 * Next.js « Functions are not valid as a child of Client Components »
 * qui apparaît quand un Server Component passe une fonction en props à
 * un Client Component.
 *
 * Ne reçoit que des strings/booléens : sérialisable au boundary.
 * Après édition réussie, fait `router.refresh()` pour que le wrapper
 * serveur re-rende avec la nouvelle valeur (la prop `valeurInitiale`
 * du wrapper est lue côté serveur et la nouvelle valeur est récupérée
 * automatiquement).
 */
interface BoutonEditerInlineProps {
  cle: string;
  valeurInitiale: string;
  multilignes?: boolean;
  longueurMax?: number;
  libelle?: string;
}

export function BoutonEditerInline({
  cle,
  valeurInitiale,
  multilignes = false,
  longueurMax = 500,
  libelle,
}: BoutonEditerInlineProps) {
  const router = useRouter();
  const chemin = usePathname();
  const [enEdition, setEnEdition] = useState(false);
  const [valeur, setValeur] = useState(valeurInitiale);
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
    setEnEdition(false);
    // Refresh pour récupérer la nouvelle valeur côté serveur dans le
    // wrapper parent. Le visiteur voit la mise à jour sans navigation.
    router.refresh();
  };

  const surAnnuler = (): void => {
    setValeur(valeurInitiale);
    setEnEdition(false);
    setErreur(null);
  };

  if (enEdition) {
    return (
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

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEnEdition(true);
      }}
      className="-top-2 -right-2 absolute z-20 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-text-3 text-xs opacity-0 shadow-md transition-opacity hover:bg-surface-2 hover:text-text-1 group-hover:opacity-100"
      aria-label={`Modifier ${libelle ?? cle}`}
    >
      <Pencil size={12} aria-hidden="true" />
    </button>
  );
}

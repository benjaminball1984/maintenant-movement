'use client';

import { poserCommentaireObjet } from '@/app/actions/commentaires';
import { Button } from '@/components/ui';
import type { ObjetCommentable } from '@/lib/commentaires';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';

interface FormulaireCommentaireProps {
  objetType: ObjetCommentable;
  objetId: string;
  /** La personne est-elle connectée ? Détermine formulaire vs invitation. */
  connecte: boolean;
  cheminRevalidation: string;
}

/**
 * Formulaire de commentaire sous un contenu. Réservé aux connecté·es :
 * sinon, on affiche une invitation à se connecter (renvoi vers la page
 * courante après connexion). Au succès, vide le champ et rafraîchit la liste.
 */
export function FormulaireCommentaire({
  objetType,
  objetId,
  connecte,
  cheminRevalidation,
}: FormulaireCommentaireProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [statut, setStatut] = useState('');
  const [enCours, demarrer] = useTransition();
  const idChamp = useId();
  const idErreur = `${idChamp}-erreur`;

  if (!connecte) {
    return (
      <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-text-2">
        <Link
          href={`/connexion?prochaine=${encodeURIComponent(pathname)}`}
          className="font-medium text-brand hover:underline"
        >
          Connecte-toi
        </Link>{' '}
        pour participer à la discussion.
      </p>
    );
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    demarrer(async () => {
      const r = await poserCommentaireObjet({
        objet_type: objetType,
        objet_id: objetId,
        texte,
        cheminRevalidation,
      });
      if (!r.ok) {
        setErreur(r.message);
        return;
      }
      setTexte('');
      setStatut('Commentaire publié');
      router.refresh();
    });
  }

  return (
    <form onSubmit={soumettre} className="grid gap-2">
      <label htmlFor={idChamp} className="sr-only">
        Écrire un commentaire
      </label>
      <textarea
        id={idChamp}
        value={texte}
        onChange={(ev) => setTexte(ev.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Écris un commentaire…"
        aria-invalid={erreur !== null ? true : undefined}
        aria-describedby={erreur !== null ? idErreur : undefined}
        className="w-full rounded-md border border-border bg-surface p-3 text-sm text-text-1 placeholder:text-text-4"
      />
      {erreur !== null ? (
        <p id={idErreur} className="text-danger text-xs">
          {erreur}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-3 text-xs">{texte.length}/2000</span>
        <Button type="submit" taille="sm" disabled={enCours || texte.trim() === ''}>
          {enCours ? 'Envoi…' : 'Commenter'}
        </Button>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {statut}
      </span>
    </form>
  );
}

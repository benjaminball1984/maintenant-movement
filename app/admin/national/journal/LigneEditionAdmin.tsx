'use client';

import { changerStatutEditionAction } from '@/app/actions/journal';
import { Button } from '@/components/ui';
import { useState, useTransition } from 'react';

type Statut = 'brouillon' | 'publie' | 'archive';

/**
 * Boutons de changement de statut pour une édition du journal (V2.4.13).
 */
export function LigneEditionAdmin({
  id,
  statut,
  libelleObjet,
}: {
  id: string;
  statut: Statut;
  /**
   * Libellé lisible de l'édition (ex. « N°12 : Titre »). Si fourni, il
   * enrichit l'`aria-label` des boutons de statut pour que le lecteur
   * d'écran distingue les lignes répétées. Optionnel : sans lui,
   * comportement inchangé.
   */
  libelleObjet?: string;
}) {
  const [enTransition, demarrerTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const changer = (nouveau: Statut) => {
    setErreur(null);
    demarrerTransition(async () => {
      const r = await changerStatutEditionAction({ id, statut: nouveau });
      if (!r.ok) setErreur(r.message);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 self-center">
      {statut !== 'publie' ? (
        <Button
          variant="primary"
          onClick={() => changer('publie')}
          disabled={enTransition}
          aria-label={libelleObjet ? `Publier : ${libelleObjet}` : undefined}
        >
          Publier
        </Button>
      ) : null}
      {statut !== 'brouillon' ? (
        <Button
          variant="outline"
          onClick={() => changer('brouillon')}
          disabled={enTransition}
          aria-label={libelleObjet ? `Passer en brouillon : ${libelleObjet}` : undefined}
        >
          Brouillon
        </Button>
      ) : null}
      {statut !== 'archive' ? (
        <Button
          variant="ghost"
          onClick={() => changer('archive')}
          disabled={enTransition}
          aria-label={libelleObjet ? `Archiver : ${libelleObjet}` : undefined}
        >
          Archiver
        </Button>
      ) : null}
      {erreur !== null && (
        <span role="alert" className="text-danger text-xs">
          {erreur}
        </span>
      )}
    </div>
  );
}

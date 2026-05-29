'use client';

import { nePlusSuivre, suivre } from '@/app/(public)/s-informer/reseau/actions';
import { Button } from '@/components/ui';
import { useState, useTransition } from 'react';

/**
 * Bouton « Suivre / Suivi·e » d'une personne sur le réseau social.
 * Mise à jour optimiste avec retour arrière en cas d'échec.
 */
export function BoutonSuivre({
  cibleId,
  jeSuisInitial,
}: {
  cibleId: string;
  jeSuisInitial: boolean;
}) {
  const [jeSuis, setJeSuis] = useState(jeSuisInitial);
  const [enCours, demarrer] = useTransition();
  // Message d'état annoncé aux lecteurs d'écran (région live masquée).
  const [messageStatut, setMessageStatut] = useState('');

  const basculer = () => {
    const avant = jeSuis;
    setJeSuis(!avant); // optimiste
    demarrer(async () => {
      const action = avant ? nePlusSuivre : suivre;
      const resultat = await action({ cible_id: cibleId });
      if (resultat.ok) {
        setMessageStatut(avant ? 'Abonnement retiré' : 'Abonnement ajouté');
      } else {
        setJeSuis(avant); // retour arrière
        setMessageStatut('Échec, réessaie');
      }
    });
  };

  return (
    <>
      <Button
        variant={jeSuis ? 'outline' : 'gradient'}
        taille="sm"
        onClick={basculer}
        disabled={enCours}
        aria-pressed={jeSuis}
      >
        {jeSuis ? 'Suivi·e' : 'Suivre'}
      </Button>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {messageStatut}
      </span>
    </>
  );
}

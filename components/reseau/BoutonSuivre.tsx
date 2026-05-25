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

  const basculer = () => {
    const avant = jeSuis;
    setJeSuis(!avant); // optimiste
    demarrer(async () => {
      const action = avant ? nePlusSuivre : suivre;
      const resultat = await action({ cible_id: cibleId });
      if (!resultat.ok) {
        setJeSuis(avant); // retour arrière
      }
    });
  };

  return (
    <Button
      variant={jeSuis ? 'outline' : 'gradient'}
      taille="sm"
      onClick={basculer}
      disabled={enCours}
    >
      {jeSuis ? 'Suivi·e' : 'Suivre'}
    </Button>
  );
}

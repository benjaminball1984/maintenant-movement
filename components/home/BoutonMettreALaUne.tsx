'use client';

import { definirUneHomeAction, retirerUneHomeAction } from '@/app/actions/une-home';
import { Button } from '@/components/ui';
import type { EmplacementUne } from '@/lib/home/une';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

/**
 * Bouton admin « Mettre à la une » / « Retirée de la une » (chantier V2.6.19).
 * Épingle (ou désépingle) ce contenu à la une de la home pour son emplacement.
 * À n'afficher qu'aux admins.
 */
export function BoutonMettreALaUne({
  emplacement,
  objetId,
  estEpingleInitial,
}: {
  emplacement: EmplacementUne;
  objetId: string;
  estEpingleInitial: boolean;
}) {
  const router = useRouter();
  const [estEpingle, setEstEpingle] = useState(estEpingleInitial);
  const [enCours, demarrer] = useTransition();

  function basculer() {
    const avant = estEpingle;
    setEstEpingle(!avant);
    demarrer(async () => {
      const r = avant
        ? await retirerUneHomeAction({ emplacement })
        : await definirUneHomeAction({ emplacement, objet_id: objetId });
      if (!r.ok) {
        setEstEpingle(avant);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={estEpingle ? 'gradient' : 'outline'}
      taille="sm"
      disabled={enCours}
      onClick={basculer}
      aria-pressed={estEpingle}
    >
      <Star
        size={14}
        strokeWidth={1.5}
        className="mr-1.5"
        fill={estEpingle ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
      {estEpingle ? 'À la une' : 'Mettre à la une'}
    </Button>
  );
}

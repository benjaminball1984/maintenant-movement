'use client';

import { confirmerReservationAction } from '@/app/actions/reservation';
import { Button } from '@/components/ui';
import { CheckCheck } from 'lucide-react';
import { useState } from 'react';

/**
 * Bouton de confirmation d'une réservation par le demandeur (V2.3.14).
 *
 * Visible uniquement quand le statut est `realisee` (le propriétaire a
 * marqué l'offre comme délivrée). Un clic, pas de double-confirmation :
 * la confirmation n'est pas destructive et c'est la fin attendue du
 * cycle de réservation. La caller-page (`/profil/reservations`)
 * conditionne déjà l'affichage via la machine à états D8.
 *
 * Une fois `confirmee`, la machine à états D8 ne propose plus aucune
 * action — le bouton disparaît au prochain refresh (Server Component
 * relit le statut après `revalidatePath`).
 */

interface BoutonConfirmerReservationProps {
  reservationId: string;
  cheminRevalidation: string;
}

export function BoutonConfirmerReservation({
  reservationId,
  cheminRevalidation,
}: BoutonConfirmerReservationProps) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surConfirmer = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await confirmerReservationAction({ reservationId, cheminRevalidation });
    setEnCours(false);
    if (!r.ok) setErreur(r.message);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="primary" taille="sm" onClick={surConfirmer} disabled={enCours}>
        <CheckCheck size={14} aria-hidden="true" />
        {enCours ? 'Confirmation…' : 'Confirmer la réalisation'}
      </Button>
      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
    </div>
  );
}

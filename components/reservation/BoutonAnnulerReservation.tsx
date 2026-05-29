'use client';

import { annulerReservationAction } from '@/app/actions/reservation';
import { Button } from '@/components/ui';
import { X } from 'lucide-react';
import { useState } from 'react';

/**
 * Bouton d'annulation d'une réservation par le demandeur (V2.3.11).
 *
 * UX volontairement minimaliste : 2 clics (« Annuler » → « Confirmer »).
 * Pas de modale lourde : un texte de confirmation inline + bouton final.
 *
 * Visible uniquement quand le statut autorise l'annulation
 * (`proposee` ou `acceptee` selon la machine à états D8). Le caller
 * (la page profil) conditionne déjà l'affichage.
 */

interface BoutonAnnulerReservationProps {
  reservationId: string;
  cheminRevalidation: string;
}

export function BoutonAnnulerReservation({
  reservationId,
  cheminRevalidation,
}: BoutonAnnulerReservationProps) {
  const [confirme, setConfirme] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageStatut, setMessageStatut] = useState('');

  const surAnnuler = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await annulerReservationAction({ reservationId, cheminRevalidation });
    setEnCours(false);
    if (!r.ok) setErreur(r.message);
    else setMessageStatut('Réservation annulée');
  };

  if (!confirme) {
    return (
      <Button variant="ghost" taille="sm" onClick={() => setConfirme(true)}>
        <X size={14} aria-hidden="true" />
        Annuler la réservation
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-2">
        Confirmer l’annulation ? Le propriétaire de l’offre sera averti.
      </p>
      <div className="flex items-center gap-2">
        <Button variant="primary" taille="sm" onClick={surAnnuler} disabled={enCours}>
          {enCours ? 'Annulation…' : 'Confirmer l’annulation'}
        </Button>
        <Button variant="ghost" taille="sm" onClick={() => setConfirme(false)} disabled={enCours}>
          Garder la réservation
        </Button>
      </div>
      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {messageStatut}
      </span>
    </div>
  );
}

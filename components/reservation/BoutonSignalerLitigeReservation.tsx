'use client';

import { signalerLitigeReservationAction } from '@/app/actions/reservation';
import { Button } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

/**
 * Bouton de signalement de litige par le demandeur sur une réservation
 * marquée « réalisée » (V2.3.16). UX en 2 étapes :
 *
 * 1. Bouton « Signaler un litige » discret (variant ghost).
 * 2. Encadré danger avec textarea motif (obligatoire, ≥10 caractères)
 *    + bouton « Confirmer le signalement » + bouton « Annuler ».
 *
 * Action terminale : une fois envoyé, la réservation passe en `litige`
 * et le bouton disparaît au refresh. La modération admin reprendra la
 * main (chantier dédié à venir).
 */

const MOTIF_MIN = 10;
const MOTIF_MAX = 1000;

interface Props {
  reservationId: string;
  cheminRevalidation: string;
}

export function BoutonSignalerLitigeReservation({ reservationId, cheminRevalidation }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surConfirmer = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await signalerLitigeReservationAction({
      reservationId,
      motif,
      cheminRevalidation,
    });
    setEnCours(false);
    if (!r.ok) setErreur(r.message);
  };

  if (!ouvert) {
    return (
      <Button variant="ghost" taille="sm" onClick={() => setOuvert(true)}>
        <AlertTriangle size={14} aria-hidden="true" />
        Signaler un litige
      </Button>
    );
  }

  const trop_court = motif.trim().length < MOTIF_MIN;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-danger bg-danger-light p-3">
      <p className="text-sm text-text-1">
        <strong>Signaler un litige.</strong> Décris ce qui s’est passé (problème de prestation,
        désaccord sur le créneau, etc.). La modération sera notifiée. Cette action est définitive
        jusqu’à arbitrage.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text-2">
          Motif (de {MOTIF_MIN} à {MOTIF_MAX} caractères) :
        </span>
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          maxLength={MOTIF_MAX}
          rows={4}
          className="rounded-md border border-border bg-surface p-2 text-text-1"
          placeholder="Explique précisément ce qui pose problème."
          disabled={enCours}
        />
        <span className="text-text-3 text-xs">
          {motif.trim().length} / {MOTIF_MAX}
        </span>
      </label>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          taille="sm"
          onClick={surConfirmer}
          disabled={enCours || trop_court}
        >
          {enCours ? 'Envoi…' : 'Confirmer le signalement'}
        </Button>
        <Button
          variant="ghost"
          taille="sm"
          onClick={() => {
            setOuvert(false);
            setMotif('');
            setErreur(null);
          }}
          disabled={enCours}
        >
          Annuler
        </Button>
      </div>
      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
    </div>
  );
}

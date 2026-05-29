'use client';

import { signalerLitigeProprietaireAction } from '@/app/actions/reservation';
import { Button } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

/**
 * Bouton de signalement de litige par le PROPRIÉTAIRE de l'offre sur
 * une réservation `acceptee` (V2.3.21, symétrique de V2.3.16).
 *
 * Cas d'usage : la prestation a démarré mais un problème grave bloque
 * sa réalisation (demandeur absent au RDV, comportement inapproprié,
 * dégradation matérielle sur un prêt, etc.).
 *
 * UX en 2 étapes (bouton ghost → encadré danger avec textarea + bouton
 * de confirmation). Motif obligatoire ≥10 caractères pour la modération.
 */

const MOTIF_MIN = 10;
const MOTIF_MAX = 1000;

interface Props {
  reservationId: string;
  cheminRevalidation: string;
}

export function BoutonSignalerLitigeProprietaire({ reservationId, cheminRevalidation }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageStatut, setMessageStatut] = useState('');

  const surConfirmer = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await signalerLitigeProprietaireAction({
      reservationId,
      motif,
      cheminRevalidation,
    });
    setEnCours(false);
    if (!r.ok) setErreur(r.message);
    else setMessageStatut('Litige signalé');
  };

  if (!ouvert) {
    return (
      <Button variant="ghost" taille="sm" onClick={() => setOuvert(true)}>
        <AlertTriangle size={14} aria-hidden="true" />
        Signaler un litige
      </Button>
    );
  }

  const tropCourt = motif.trim().length < MOTIF_MIN;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-danger bg-danger-light p-3">
      <p className="text-sm text-text-1">
        <strong>Signaler un litige.</strong> Décris ce qui pose problème (absence du demandeur,
        comportement inapproprié, dégradation matérielle, etc.). La modération sera notifiée.
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
          disabled={enCours || tropCourt}
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
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {messageStatut}
      </span>
    </div>
  );
}

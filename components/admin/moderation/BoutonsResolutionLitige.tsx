'use client';

import { resoudreLitigeReservationAction } from '@/app/actions/reservation';
import { Button } from '@/components/ui';
import { Gavel, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

/**
 * Boutons de résolution de litige côté admin (V2.3.17).
 *
 * UX en 2 étapes :
 * 1. Bouton principal « Arbitrer ce litige » (variant ghost).
 * 2. Encadré avec textarea motif obligatoire (≥10 caractères) et 2
 *    boutons de décision :
 *    - « Trancher en faveur du propriétaire (confirmer) » : la prestation
 *      est considérée comme réalisée correctement, statut = `confirmee`.
 *    - « Trancher en faveur du demandeur (annuler) » : la prestation est
 *      considérée comme non réalisée / litige justifié, statut = `annulee`.
 *
 * Le motif est communiqué aux deux parties via le journal D8bis et
 * sera repris dans une notif quand la table sera là.
 */

const MOTIF_MIN = 10;
const MOTIF_MAX = 2000;

export function BoutonsResolutionLitige({
  reservationId,
  cheminRevalidation,
}: {
  reservationId: string;
  cheminRevalidation: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState('');
  const [enCours, setEnCours] = useState<'confirmee' | 'annulee' | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const surTrancher = async (decision: 'confirmee' | 'annulee') => {
    setEnCours(decision);
    setErreur(null);
    const r = await resoudreLitigeReservationAction({
      reservationId,
      decision,
      motif,
      cheminRevalidation,
    });
    setEnCours(null);
    if (!r.ok) setErreur(r.message);
  };

  if (!ouvert) {
    return (
      <Button variant="ghost" taille="sm" onClick={() => setOuvert(true)}>
        <Gavel size={14} aria-hidden="true" />
        Arbitrer ce litige
      </Button>
    );
  }

  const tropCourt = motif.trim().length < MOTIF_MIN;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface-2 p-3">
      <p className="text-sm text-text-1">
        <strong>Arbitrage du litige.</strong> La décision et son motif seront enregistrés au journal
        et visibles par les deux parties.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text-2">
          Motif de la décision (de {MOTIF_MIN} à {MOTIF_MAX} caractères) :
        </span>
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          maxLength={MOTIF_MAX}
          rows={5}
          className="rounded-md border border-border bg-surface p-2 text-text-1"
          placeholder="Explique l’arbitrage. Cette explication sera visible par le demandeur et le propriétaire."
          disabled={enCours !== null}
        />
        <span className="text-text-3 text-xs">
          {motif.trim().length} / {MOTIF_MAX}
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          taille="sm"
          onClick={() => surTrancher('confirmee')}
          disabled={enCours !== null || tropCourt}
        >
          <ThumbsUp size={14} aria-hidden="true" />
          {enCours === 'confirmee' ? 'Arbitrage…' : 'Trancher pour le propriétaire (confirmer)'}
        </Button>
        <Button
          variant="primary"
          taille="sm"
          onClick={() => surTrancher('annulee')}
          disabled={enCours !== null || tropCourt}
        >
          <ThumbsDown size={14} aria-hidden="true" />
          {enCours === 'annulee' ? 'Arbitrage…' : 'Trancher pour le demandeur (annuler)'}
        </Button>
        <Button
          variant="ghost"
          taille="sm"
          onClick={() => {
            setOuvert(false);
            setMotif('');
            setErreur(null);
          }}
          disabled={enCours !== null}
        >
          Fermer
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

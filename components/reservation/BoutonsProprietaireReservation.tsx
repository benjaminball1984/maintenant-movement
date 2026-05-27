'use client';

import {
  accepterReservationAction,
  marquerReservationRealiseeAction,
  refuserReservationAction,
} from '@/app/actions/reservation';
import { Button } from '@/components/ui';
import type { StatutReservation } from '@/lib/reservation';
import { Check, CheckCheck, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Boutons d'action pour le propriétaire d'une offre sur une réservation
 * reçue (cycle V2 V2.3.13). Selon le statut courant et la machine à
 * états D8 :
 *
 * - `proposee` → Accepter / Refuser.
 * - `acceptee` → Marquer réalisée.
 * - autres états → pas d'action visible (terminaux ou en attente
 *   d'action du demandeur).
 *
 * UX : 2 clics pour les actions destructives (Refuser), 1 clic pour les
 * actions constructives (Accepter, Marquer réalisée). Pas de modale
 * lourde — confirmation inline pour Refuser.
 */

interface BoutonsProprietaireReservationProps {
  reservationId: string;
  statut: StatutReservation;
  cheminRevalidation: string;
}

export function BoutonsProprietaireReservation({
  reservationId,
  statut,
  cheminRevalidation,
}: BoutonsProprietaireReservationProps) {
  const [enCours, setEnCours] = useState<'accepter' | 'refuser' | 'realiser' | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmeRefus, setConfirmeRefus] = useState(false);

  if (statut === 'proposee') {
    return (
      <div className="flex flex-col gap-2">
        {confirmeRefus ? (
          <div className="flex flex-col gap-2 rounded-md border border-danger bg-danger-light p-3">
            <p className="text-sm text-text-1">Confirmer le refus ? Le demandeur sera averti.</p>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                taille="sm"
                onClick={async () => {
                  setEnCours('refuser');
                  setErreur(null);
                  const r = await refuserReservationAction({
                    reservationId,
                    cheminRevalidation,
                  });
                  setEnCours(null);
                  if (!r.ok) setErreur(r.message);
                  else setConfirmeRefus(false);
                }}
                disabled={enCours !== null}
              >
                {enCours === 'refuser' ? 'Refus…' : 'Confirmer le refus'}
              </Button>
              <Button
                variant="ghost"
                taille="sm"
                onClick={() => setConfirmeRefus(false)}
                disabled={enCours !== null}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              taille="sm"
              onClick={async () => {
                setEnCours('accepter');
                setErreur(null);
                const r = await accepterReservationAction({
                  reservationId,
                  cheminRevalidation,
                });
                setEnCours(null);
                if (!r.ok) setErreur(r.message);
              }}
              disabled={enCours !== null}
            >
              <Check size={14} aria-hidden="true" />
              {enCours === 'accepter' ? 'Acceptation…' : 'Accepter'}
            </Button>
            <Button
              variant="ghost"
              taille="sm"
              onClick={() => setConfirmeRefus(true)}
              disabled={enCours !== null}
            >
              <X size={14} aria-hidden="true" />
              Refuser
            </Button>
          </div>
        )}
        {erreur !== null && (
          <p role="alert" className="text-danger text-sm">
            {erreur}
          </p>
        )}
      </div>
    );
  }

  if (statut === 'acceptee') {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          taille="sm"
          onClick={async () => {
            setEnCours('realiser');
            setErreur(null);
            const r = await marquerReservationRealiseeAction({
              reservationId,
              cheminRevalidation,
            });
            setEnCours(null);
            if (!r.ok) setErreur(r.message);
          }}
          disabled={enCours !== null}
        >
          <CheckCheck size={14} aria-hidden="true" />
          {enCours === 'realiser' ? 'Marquage…' : 'Marquer comme réalisée'}
        </Button>
        {erreur !== null && (
          <p role="alert" className="text-danger text-sm">
            {erreur}
          </p>
        )}
      </div>
    );
  }

  // Autres statuts : terminaux ou en attente du demandeur, pas d'action ici.
  return null;
}

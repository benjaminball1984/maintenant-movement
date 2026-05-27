'use client';

import {
  annulerTransactionSortanteAction,
  confirmerTransactionSortanteAction,
} from '@/app/actions/transaction-sortante';
import { Button } from '@/components/ui';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Boutons d'action sur une transaction sortante (V2.3.36).
 *
 * Affichés uniquement si statut === 'initiee'. UX :
 * - 1 clic « Confirmer » (action positive, contrôle comptable validé).
 * - 2 clics « Annuler » avec textarea motif obligatoire ≥ 5 caractères.
 */

interface Props {
  transactionId: string;
  caisseId: string;
}

export function BoutonsTransactionSortante({ transactionId, caisseId }: Props) {
  const [enCours, setEnCours] = useState<'confirmer' | 'annuler' | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvertAnnuler, setOuvertAnnuler] = useState(false);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const surConfirmer = async () => {
    setEnCours('confirmer');
    setErreur(null);
    const r = await confirmerTransactionSortanteAction({ transactionId, caisseId });
    setEnCours(null);
    if (!r.ok) setErreur(r.message);
  };

  const surAnnuler = async () => {
    setEnCours('annuler');
    setErreur(null);
    const r = await annulerTransactionSortanteAction({
      transactionId,
      caisseId,
      motif: motifAnnulation,
    });
    setEnCours(null);
    if (!r.ok) setErreur(r.message);
    else {
      setOuvertAnnuler(false);
      setMotifAnnulation('');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!ouvertAnnuler ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" taille="sm" onClick={surConfirmer} disabled={enCours !== null}>
            <Check size={14} aria-hidden="true" />
            {enCours === 'confirmer' ? 'Confirmation…' : 'Confirmer le reversement'}
          </Button>
          <Button
            variant="ghost"
            taille="sm"
            onClick={() => setOuvertAnnuler(true)}
            disabled={enCours !== null}
          >
            <X size={14} aria-hidden="true" />
            Annuler
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border border-danger bg-danger-light p-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text-1">Motif d’annulation (5 caractères min) :</span>
            <textarea
              value={motifAnnulation}
              onChange={(e) => setMotifAnnulation(e.target.value)}
              rows={3}
              maxLength={500}
              className="rounded-md border border-border bg-surface p-2 text-text-1"
              placeholder="Ex. erreur de saisie, double-paiement détecté…"
              disabled={enCours !== null}
            />
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              taille="sm"
              onClick={surAnnuler}
              disabled={enCours !== null || motifAnnulation.trim().length < 5}
            >
              {enCours === 'annuler' ? 'Annulation…' : 'Confirmer l’annulation'}
            </Button>
            <Button
              variant="ghost"
              taille="sm"
              onClick={() => {
                setOuvertAnnuler(false);
                setMotifAnnulation('');
              }}
              disabled={enCours !== null}
            >
              Revenir
            </Button>
          </div>
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

'use client';

import { Button } from '@/components/ui';
import { Check, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { approuverCagnotteExterne, rejeterCagnotteExterne } from './actions';

/**
 * Boutons de modération a priori d'une collecte externe (V2.6.124).
 * « Approuver » la publie ; « Rejeter » ouvre un motif facultatif puis la
 * marque refusée (jamais re-proposée).
 */
export function BoutonsModeration({ id }: { id: string }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmRejet, setConfirmRejet] = useState(false);
  const [raison, setRaison] = useState('');

  function approuver() {
    setErreur(null);
    demarrer(async () => {
      const r = await approuverCagnotteExterne(id);
      if (!r.ok) {
        setErreur(r.message);
        return;
      }
      router.refresh();
    });
  }

  function rejeter() {
    setErreur(null);
    demarrer(async () => {
      const r = await rejeterCagnotteExterne(id, raison.trim() === '' ? undefined : raison.trim());
      if (!r.ok) {
        setErreur(r.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="gradient" taille="sm" disabled={enCours} onClick={approuver}>
          <Check size={14} strokeWidth={2} className="mr-1.5" aria-hidden="true" />
          {enCours ? '…' : 'Approuver'}
        </Button>
        <Button
          type="button"
          variant="outline"
          taille="sm"
          disabled={enCours}
          onClick={() => setConfirmRejet((v) => !v)}
        >
          <Trash2 size={14} strokeWidth={1.6} className="mr-1.5" aria-hidden="true" />
          Rejeter
        </Button>
      </div>

      {confirmRejet ? (
        <div className="grid gap-2 rounded-md border border-border bg-surface-2 p-2">
          <input
            type="text"
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            placeholder="Motif (facultatif)"
            maxLength={500}
            className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-text-1"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              taille="sm"
              disabled={enCours}
              onClick={rejeter}
              className="text-danger"
            >
              {enCours ? 'Rejet…' : 'Confirmer le rejet'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              taille="sm"
              disabled={enCours}
              onClick={() => setConfirmRejet(false)}
            >
              <X size={14} strokeWidth={1.5} className="mr-1.5" aria-hidden="true" />
              Annuler
            </Button>
          </div>
        </div>
      ) : null}

      {erreur !== null ? <p className="text-xs font-bold text-danger">{erreur}</p> : null}
    </div>
  );
}

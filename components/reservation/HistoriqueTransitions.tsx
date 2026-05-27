import type { EntreeJournalReservation } from '@/lib/reservation';
import { History } from 'lucide-react';

/**
 * Affiche l'historique des transitions de statut d'une réservation
 * (cycle V2 V2.3.15, doctrine D8bis « cycle observable des deux côtés »).
 *
 * Server Component pur : reçoit les entrées déjà chargées (via
 * `listerJournauxReservations` côté page parent). Replié par défaut dans
 * un `<details>` pour ne pas alourdir la carte ; déplié à la demande.
 *
 * Quand le journal est vide (transition initiale `null → proposee` non
 * journalisée, ou journal manquant), on n'affiche rien.
 */

const LIBELLE = {
  proposee: 'proposée',
  acceptee: 'acceptée',
  refusee: 'refusée',
  realisee: 'réalisée',
  confirmee: 'confirmée',
  annulee: 'annulée',
  litige: 'litige',
} as const;

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function HistoriqueTransitions({
  entrees,
}: {
  entrees: EntreeJournalReservation[];
}) {
  if (entrees.length === 0) return null;

  return (
    <details className="rounded-md border border-border bg-surface-2 p-3 text-sm">
      <summary className="cursor-pointer text-text-2">
        <History size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
        Historique ({entrees.length})
      </summary>
      <ol className="mt-3 grid gap-2">
        {entrees.map((e) => (
          <li key={e.id} className="border-border border-l-2 pl-3">
            <p className="text-text-1">
              <strong>{LIBELLE[e.statutAvant]}</strong> → <strong>{LIBELLE[e.statutApres]}</strong>
              <span className="ml-2 text-text-3 text-xs">
                {FORMATEUR.format(new Date(e.changedAt))}
              </span>
            </p>
            {e.motif !== null ? (
              <p className="mt-0.5 text-text-3 text-xs italic">« {e.motif} »</p>
            ) : null}
          </li>
        ))}
      </ol>
    </details>
  );
}

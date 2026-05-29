'use client';

import type { ResultatArchivage } from '@/app/actions/archivage';
import { Alert, Button } from '@/components/ui';
import { Archive } from 'lucide-react';
import { useState } from 'react';

/**
 * Bouton générique d'archivage / retrait / annulation (V2.4.101).
 *
 * Réutilisable pour toutes les entités V1 : cagnotte, mobilisation,
 * campagne, moment, média, sondage. La Server Action et le libellé
 * sont passés en props.
 *
 * Pattern 2 étapes : clic bouton → mini-formulaire raison (optionnelle)
 * → confirmation. Bordure danger pour visibilité.
 */
export interface BoutonArchiverEntiteProps {
  id: string;
  /** Server Action qui prend `{id, raison?}` et retourne `ResultatArchivage`. */
  action: (donnees: unknown) => Promise<ResultatArchivage>;
  /** Verbe affiché : « Archiver », « Retirer », « Annuler », « Fermer »… */
  verbe: string;
  /** Phrase de description courte. */
  description: string;
  /** Si fourni, change le label du champ raison (sinon « Raison (optionnelle) »). */
  labelRaison?: string;
  /** Callback après succès (par ex. router.push). */
  onSucces?: () => void;
}

export function BoutonArchiverEntite({
  id,
  action,
  verbe,
  description,
  labelRaison = 'Raison (optionnelle)',
  onSucces,
}: BoutonArchiverEntiteProps) {
  const [etape, setEtape] = useState<'fermee' | 'ouverte'>('fermee');
  const [raison, setRaison] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  /** Message d'état pour lecteur d'écran (annonce du succès, sinon muet). */
  const [messageStatut, setMessageStatut] = useState('');

  const executer = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await action({
      id,
      raison: raison.trim() === '' ? undefined : raison.trim(),
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(true);
    setMessageStatut('Action effectuée');
    setEtape('fermee');
    if (onSucces !== undefined) onSucces();
  };

  if (succes) {
    return (
      <>
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {messageStatut}
        </span>
        <Alert variant="success" titre="Action effectuée">
          {verbe} appliqué avec succès. L'entité est masquée de l'UI publique.
        </Alert>
      </>
    );
  }

  if (etape === 'fermee') {
    return (
      <div className="grid gap-2 rounded-md border border-danger/30 bg-danger-light/30 p-4">
        <p className="font-bold text-text-1">{verbe}</p>
        <p className="text-sm text-text-2">{description}</p>
        <div>
          <Button variant="outline" onClick={() => setEtape('ouverte')}>
            <Archive size={14} aria-hidden="true" />
            {verbe}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border border-danger bg-danger-light/30 p-4">
      <p className="font-bold text-text-1">Confirmer : {verbe}</p>
      <label className="grid gap-1 text-sm">
        {labelRaison}
        <textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full rounded-md border border-border bg-surface p-2"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={executer} disabled={enCours}>
          {enCours ? 'En cours…' : `Confirmer ${verbe.toLowerCase()}`}
        </Button>
        <Button variant="ghost" onClick={() => setEtape('fermee')} disabled={enCours}>
          Annuler
        </Button>
      </div>
      {erreur !== null && (
        <Alert variant="danger" titre="Erreur">
          {erreur}
        </Alert>
      )}
    </div>
  );
}

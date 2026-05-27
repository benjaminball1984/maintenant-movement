'use client';

import {
  type ResultatArchivage,
  supprimerEntiteDefinitivementAction,
} from '@/app/actions/archivage';
import { Alert, Button } from '@/components/ui';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Bouton de SUPPRESSION DÉFINITIVE d'une entité (V2.4.102).
 *
 * Admin uniquement (garde côté Server Action `est_admin_general`).
 * Pattern double confirmation :
 *   1. Clic « Supprimer définitivement » → champ texte apparaît
 *   2. L'admin doit taper exactement le nom de la table
 *      (ex. « petition » pour supprimer une pétition)
 *   3. Clic « Confirmer » → DROP physique
 *
 * Refusé côté Server Action si :
 * - Pétition a des signatures
 * - Cagnotte a des dons confirmés
 *
 * Pour ces cas, le composant `BoutonArchiverEntite` reste la voie.
 */
export interface BoutonSupprimerEntiteProps {
  table:
    | 'petition'
    | 'cagnotte'
    | 'mobilisation'
    | 'campagne'
    | 'moment_solidaire'
    | 'media'
    | 'sondage';
  id: string;
  /** Chemin de redirection après suppression réussie. */
  redirigerVers?: string;
}

export function BoutonSupprimerEntite({ table, id, redirigerVers }: BoutonSupprimerEntiteProps) {
  const router = useRouter();
  const [etape, setEtape] = useState<'fermee' | 'ouverte'>('fermee');
  const [confirmation, setConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const supprimer = async (): Promise<void> => {
    setEnCours(true);
    setErreur(null);
    const r: ResultatArchivage = await supprimerEntiteDefinitivementAction({
      table,
      id,
      confirmation: confirmation.trim(),
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    if (redirigerVers !== undefined) {
      router.push(redirigerVers);
    } else {
      router.refresh();
    }
  };

  if (etape === 'fermee') {
    return (
      <div className="grid gap-2 rounded-md border-2 border-danger bg-danger-light/50 p-4">
        <p className="font-bold text-danger">⚠️ Suppression définitive</p>
        <p className="text-sm text-text-2">
          DROP physique en base, irréversible. Réservé aux cas créés par erreur (pétition jamais
          signée, cagnotte de test, doublon). Refusé si signatures / dons existants — utilise plutôt
          « Archiver » dans ce cas.
        </p>
        <div>
          <Button variant="outline" onClick={() => setEtape('ouverte')}>
            <Trash2 size={14} aria-hidden="true" />
            Supprimer définitivement
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border-2 border-danger bg-danger-light/60 p-4">
      <p className="font-bold text-danger">⚠️ Confirmation définitive</p>
      <p className="text-sm text-text-2">
        Tape exactement <code className="font-mono font-bold">{table}</code> ci-dessous pour
        autoriser le DROP. <strong>Aucun retour possible</strong> après confirmation.
      </p>
      <input
        type="text"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder={table}
        className="w-full rounded-md border-2 border-danger bg-surface p-2 font-mono"
        autoComplete="off"
        spellCheck={false}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={supprimer}
          disabled={enCours || confirmation.trim() !== table}
        >
          {enCours ? 'Suppression…' : 'Supprimer (irréversible)'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setEtape('fermee');
            setConfirmation('');
            setErreur(null);
          }}
          disabled={enCours}
        >
          Annuler
        </Button>
      </div>
      {erreur !== null && (
        <Alert variant="danger" titre="Refus">
          {erreur}
        </Alert>
      )}
    </div>
  );
}

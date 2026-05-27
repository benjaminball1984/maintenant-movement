'use client';

import { archiverPetition } from '@/app/(public)/mobiliser/petitions/actions';
import { Alert, Button } from '@/components/ui';
import { Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Bouton admin pour archiver une pétition (V2.4.100).
 *
 * Affiche un mini-formulaire en 2 étapes : clic → champ raison (optionnel)
 * → confirmation. La pétition passe en statut `archivee` et disparaît
 * de l'UI publique. Signatures conservées (doctrine §0.3).
 */
export function BoutonArchiverPetition({ petitionId }: { petitionId: string }) {
  const router = useRouter();
  const [etape, setEtape] = useState<'fermee' | 'ouverte'>('fermee');
  const [raison, setRaison] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const archiver = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await archiverPetition({
      petition_id: petitionId,
      raison: raison.trim() === '' ? undefined : raison.trim(),
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    router.push('/admin/petitions');
  };

  if (etape === 'fermee') {
    return (
      <div className="grid gap-2 rounded-md border border-danger/30 bg-danger-light/30 p-4">
        <p className="font-bold text-text-1">Archiver cette pétition</p>
        <p className="text-sm text-text-2">
          Elle disparaît de l'UI publique mais reste en base (signatures conservées). Réversible en
          remettant le statut à « publiee » en SQL.
        </p>
        <div>
          <Button variant="outline" onClick={() => setEtape('ouverte')}>
            <Archive size={14} aria-hidden="true" />
            Archiver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border border-danger bg-danger-light/30 p-4">
      <p className="font-bold text-text-1">Confirmer l'archivage</p>
      <label className="grid gap-1 text-sm">
        Raison (optionnelle, sauvegardée dans `raison_rejet`)
        <textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full rounded-md border border-border bg-surface p-2"
          placeholder="ex. doublon, contenu obsolète, demande de la créatrice…"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={archiver} disabled={enCours}>
          {enCours ? 'Archivage…' : 'Confirmer l’archivage'}
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

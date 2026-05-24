'use client';

import { retirerDroit } from '@/app/admin/national/droits/actions';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Bouton de retrait d'un droit d'administration (console nationale).
 *
 * Demande une confirmation en deux temps (clic « Retirer » puis
 * « Confirmer ») pour éviter les retraits accidentels. Le retrait est
 * un soft delete : la ligne `droit_admin` est conservée avec `retire_le`
 * renseigné (historique + journal d'audit).
 */
export function BoutonRetirerDroit({ droitId }: { droitId: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function retirer() {
    setErreur(null);
    setEnCours(true);
    const resultat = await retirerDroit({ droit_id: droitId });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      setConfirmation(false);
      return;
    }
    router.refresh();
  }

  if (erreur !== null) {
    return (
      <div className="text-right">
        <p className="mb-1 text-xs text-danger">{erreur}</p>
        <Button variant="ghost" taille="sm" onClick={() => setErreur(null)}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!confirmation) {
    return (
      <Button variant="ghost" taille="sm" onClick={() => setConfirmation(true)}>
        Retirer
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" taille="sm" onClick={retirer} disabled={enCours}>
        {enCours ? 'Retrait...' : 'Confirmer'}
      </Button>
      <Button variant="ghost" taille="sm" onClick={() => setConfirmation(false)} disabled={enCours}>
        Annuler
      </Button>
    </div>
  );
}

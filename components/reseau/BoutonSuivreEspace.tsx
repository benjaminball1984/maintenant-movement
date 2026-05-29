'use client';

import { basculerAbonnementEspaceAction } from '@/app/actions/abonnement-espace';
import { Button } from '@/components/ui';
import type { TypeEspacePostable } from '@/lib/reseau/types-espace';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';

interface BoutonSuivreEspaceProps {
  espaceType: TypeEspacePostable;
  espaceId: string;
  espaceNom: string;
  jeSuisInitial: boolean;
  cheminRevalidation?: string;
}

/**
 * Bouton « Suivre » / « Suivi·e » pour un espace collectif (V2.5.22, sous-chantier
 * V2.5.10.d). Symétrique de `<BoutonSuivre>` pour les personnes.
 *
 * Quand la personne suit l'espace, les posts publiés au nom de cet espace
 * remontent au palier 1 (« suivi·e ») de son flux transparent (au lieu
 * du palier 2 « reste »).
 */
export function BoutonSuivreEspace({
  espaceType,
  espaceId,
  espaceNom,
  jeSuisInitial,
  cheminRevalidation,
}: BoutonSuivreEspaceProps) {
  const [jeSuis, setJeSuis] = useState(jeSuisInitial);
  const [enCours, setEnCours] = useState(false);

  async function basculer() {
    setEnCours(true);
    const avant = jeSuis;
    setJeSuis(!avant);
    const r = await basculerAbonnementEspaceAction({
      espaceType,
      espaceId,
      cheminRevalidation,
    });
    setEnCours(false);
    if (!r.ok) {
      // Rollback optimiste
      setJeSuis(avant);
      return;
    }
    setJeSuis(r.jeSuis);
  }

  return (
    <Button
      onClick={basculer}
      variant={jeSuis ? 'ghost' : 'outline'}
      taille="sm"
      disabled={enCours}
      aria-pressed={jeSuis}
    >
      {jeSuis ? (
        <>
          <Check size={14} strokeWidth={1.5} className="mr-1.5" aria-hidden="true" />
          Suivi·e dans le réseau
        </>
      ) : (
        <>
          <Plus size={14} strokeWidth={1.5} className="mr-1.5" aria-hidden="true" />
          Suivre {espaceNom} dans le réseau
        </>
      )}
    </Button>
  );
}

'use client';

import {
  accepterAmi,
  demanderAmi,
  refuserAmi,
  retirerAmi,
} from '@/app/(public)/s-informer/reseau/actions';
import { Button } from '@/components/ui';
import type { EtatAmitie } from '@/lib/reseau/amitie';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

/**
 * Boutons d'amitié réseau (épopée réseau V2, chantier D.1).
 *
 * Affiche l'action pertinente selon l'état d'amitié entre le lecteur courant
 * et la cible :
 * - `aucune` (avec droit de demander) : « Demander en ami·e ».
 * - `demande_envoyee` : « Demande envoyée » (clic = annuler).
 * - `demande_recue` : « Accepter » / « Refuser ».
 * - `amis` : « Ami·e ✓ » (clic = retirer).
 *
 * Si l'état est `aucune` SANS droit de demander (la cible ne te suit pas et
 * n'autorise pas les demandes ouvertes), aucun bouton n'est rendu.
 *
 * Après chaque action réussie, `router.refresh()` reconcilie l'état serveur
 * (l'amitié débloque aussi le suivi mutuel et la messagerie).
 */
export function BoutonAmitie({ cibleId, etat }: { cibleId: string; etat: EtatAmitie }) {
  const router = useRouter();
  const [statut, setStatut] = useState(etat.statut);
  const [enCours, demarrer] = useTransition();
  const [message, setMessage] = useState('');

  const lancer = (
    action: () => Promise<{ ok: boolean; message?: string }>,
    statutOptimiste: EtatAmitie['statut'],
    annonce: string,
  ) => {
    const avant = statut;
    setStatut(statutOptimiste);
    demarrer(async () => {
      const r = await action();
      if (r.ok) {
        setMessage(annonce);
        router.refresh();
      } else {
        setStatut(avant);
        setMessage(r.message ?? 'Échec, réessaie.');
      }
    });
  };

  let contenu: React.ReactNode = null;

  if (statut === 'amis') {
    contenu = (
      <Button
        variant="outline"
        taille="sm"
        disabled={enCours}
        onClick={() =>
          lancer(() => retirerAmi({ amitie_id: etat.amitieId }), 'aucune', 'Amitié retirée')
        }
      >
        Ami·e ✓
      </Button>
    );
  } else if (statut === 'demande_envoyee') {
    contenu = (
      <Button
        variant="outline"
        taille="sm"
        disabled={enCours}
        onClick={() =>
          lancer(() => retirerAmi({ amitie_id: etat.amitieId }), 'aucune', 'Demande annulée')
        }
      >
        Demande envoyée
      </Button>
    );
  } else if (statut === 'demande_recue') {
    contenu = (
      <span className="flex flex-wrap gap-2">
        <Button
          variant="gradient"
          taille="sm"
          disabled={enCours}
          onClick={() =>
            lancer(() => accepterAmi({ amitie_id: etat.amitieId }), 'amis', 'Demande acceptée')
          }
        >
          Accepter l’ami·e
        </Button>
        <Button
          variant="ghost"
          taille="sm"
          disabled={enCours}
          onClick={() =>
            lancer(() => refuserAmi({ amitie_id: etat.amitieId }), 'aucune', 'Demande refusée')
          }
        >
          Refuser
        </Button>
      </span>
    );
  } else if (etat.peutDemander) {
    // statut 'aucune' avec droit de demander.
    contenu = (
      <Button
        variant="outline"
        taille="sm"
        disabled={enCours}
        onClick={() =>
          lancer(() => demanderAmi({ cible_id: cibleId }), 'demande_envoyee', 'Demande envoyée')
        }
      >
        Demander en ami·e
      </Button>
    );
  }

  if (contenu === null) return null;

  return (
    <>
      {contenu}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {message}
      </span>
    </>
  );
}

'use client';

import { seDeconnecter } from '@/app/(auth)/actions';
import { Button } from '@/components/ui';
import { useState } from 'react';

/**
 * Bouton de déconnexion. Client Component pour gérer l'état pendant la
 * Server Action `seDeconnecter` (qui redirige vers `/`).
 */
export function BoutonDeconnexion() {
  const [enCours, setEnCours] = useState(false);

  async function gererClic() {
    setEnCours(true);
    await seDeconnecter();
    // La Server Action `seDeconnecter` redirige (`never`).
  }

  return (
    <Button variant="ghost" taille="sm" onClick={gererClic} disabled={enCours}>
      {enCours ? 'Déconnexion en cours...' : 'Se déconnecter'}
    </Button>
  );
}

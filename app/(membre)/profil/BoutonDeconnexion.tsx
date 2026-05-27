'use client';

import { seDeconnecter } from '@/app/(auth)/actions';
import { Button } from '@/components/ui';
import { useState } from 'react';

/**
 * Bouton de deconnexion. Client Component pour gerer l'etat pendant la
 * Server Action `seDeconnecter` (qui redirige vers `/`). Les libelles
 * sont passes en props par le layout parent qui les lit depuis le CMS.
 */
export function BoutonDeconnexion({
  libelle,
  libelleEnCours,
}: {
  libelle: string;
  libelleEnCours: string;
}) {
  const [enCours, setEnCours] = useState(false);

  async function gererClic() {
    setEnCours(true);
    await seDeconnecter();
    // La Server Action `seDeconnecter` redirige (`never`).
  }

  return (
    <Button variant="ghost" taille="sm" onClick={gererClic} disabled={enCours}>
      {enCours ? libelleEnCours : libelle}
    </Button>
  );
}

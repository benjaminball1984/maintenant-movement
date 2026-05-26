'use client';

import { quitterGroupe, rejoindreGroupe } from '@/app/actions/groupe-entraide-local';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { useState } from 'react';

/**
 * Boutons « Rejoindre / Quitter » pour un groupe d'entraide local
 * (cycle V2 V2.3.2). Composant client minimaliste qui orchestre la
 * Server Action et affiche une éventuelle erreur.
 */

interface BoutonsAdhesionProps {
  groupeId: string;
  estMembre: boolean;
  estConnecte: boolean;
}

export function BoutonsAdhesion({ groupeId, estMembre, estConnecte }: BoutonsAdhesionProps) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surRejoindre = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await rejoindreGroupe(groupeId);
    if (!r.ok) setErreur(r.message ?? 'Action impossible.');
    setEnCours(false);
  };

  const surQuitter = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await quitterGroupe(groupeId);
    if (!r.ok) setErreur(r.message ?? 'Action impossible.');
    setEnCours(false);
  };

  if (!estConnecte) {
    return (
      <Link
        href="/connexion?prochaine=/s-entraider/groupes-locaux"
        className="inline-flex h-11 items-center rounded-md bg-grad px-4 font-bold text-sm text-white shadow-brand transition hover:brightness-110"
      >
        Se connecter pour rejoindre
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {estMembre ? (
        <Button variant="ghost" onClick={surQuitter} disabled={enCours}>
          {enCours ? 'En cours…' : 'Quitter le groupe'}
        </Button>
      ) : (
        <Button variant="primary" onClick={surRejoindre} disabled={enCours}>
          {enCours ? 'En cours…' : 'Rejoindre le groupe'}
        </Button>
      )}
      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
    </div>
  );
}

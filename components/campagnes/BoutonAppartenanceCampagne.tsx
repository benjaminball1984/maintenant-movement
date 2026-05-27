'use client';

import { quitterCampagne, rejoindreCampagne } from '@/app/actions/appartenance-campagne';
import { Button } from '@/components/ui';
import { LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';

/**
 * Bouton Rejoindre / Quitter une campagne (V2.3.34).
 *
 * Si non membre : bouton primary « Rejoindre ».
 * Si membre : bouton ghost « Quitter » avec confirmation 2-clics.
 *
 * Le caller (page campagne) charge l'état initial côté serveur via
 * `chargerEstMembreCampagne` (à brancher).
 */

interface Props {
  campagneId: string;
  estMembreInitial: boolean;
}

export function BoutonAppartenanceCampagne({ campagneId, estMembreInitial }: Props) {
  const [estMembre, setEstMembre] = useState(estMembreInitial);
  const [confirmeQuitter, setConfirmeQuitter] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surRejoindre = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await rejoindreCampagne(campagneId);
    setEnCours(false);
    if (!r.ok) setErreur(r.message);
    else setEstMembre(true);
  };

  const surQuitter = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await quitterCampagne(campagneId);
    setEnCours(false);
    if (!r.ok) setErreur(r.message);
    else {
      setEstMembre(false);
      setConfirmeQuitter(false);
    }
  };

  if (!estMembre) {
    return (
      <div className="flex flex-col gap-1">
        <Button onClick={surRejoindre} disabled={enCours}>
          <LogIn size={16} aria-hidden="true" />
          {enCours ? 'Inscription…' : 'Rejoindre la campagne'}
        </Button>
        {erreur !== null && (
          <p role="alert" className="text-danger text-xs">
            {erreur}
          </p>
        )}
      </div>
    );
  }

  if (!confirmeQuitter) {
    return (
      <div className="flex flex-col gap-1">
        <Button variant="ghost" taille="sm" onClick={() => setConfirmeQuitter(true)}>
          <LogOut size={14} aria-hidden="true" />
          Quitter la campagne
        </Button>
        <p className="text-text-3 text-xs">Tu es membre de cette campagne.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-2 p-3">
      <p className="text-sm text-text-1">Confirmer le départ de la campagne ?</p>
      <div className="flex items-center gap-2">
        <Button variant="primary" taille="sm" onClick={surQuitter} disabled={enCours}>
          {enCours ? 'Départ…' : 'Confirmer le départ'}
        </Button>
        <Button
          variant="ghost"
          taille="sm"
          onClick={() => setConfirmeQuitter(false)}
          disabled={enCours}
        >
          Rester membre
        </Button>
      </div>
      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
    </div>
  );
}

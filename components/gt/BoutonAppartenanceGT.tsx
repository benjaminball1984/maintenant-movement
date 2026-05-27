'use client';

import { quitterGT, rejoindreGT } from '@/app/actions/appartenance-gt';
import { Button } from '@/components/ui';
import { LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';

/**
 * Bouton Rejoindre/Quitter un GT thématique (V2.3.38). Aligné sur le
 * pattern V2.3.34 (campagne).
 */

interface Props {
  gtId: string;
  estMembreInitial: boolean;
}

export function BoutonAppartenanceGT({ gtId, estMembreInitial }: Props) {
  const [estMembre, setEstMembre] = useState(estMembreInitial);
  const [confirmeQuitter, setConfirmeQuitter] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surRejoindre = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await rejoindreGT(gtId);
    setEnCours(false);
    if (!r.ok) setErreur(r.message);
    else setEstMembre(true);
  };

  const surQuitter = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await quitterGT(gtId);
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
          {enCours ? 'Inscription…' : 'Rejoindre ce GT'}
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
          Quitter ce GT
        </Button>
        <p className="text-text-3 text-xs">Tu es membre de ce GT.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-2 p-3">
      <p className="text-sm text-text-1">Confirmer le départ du GT ?</p>
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

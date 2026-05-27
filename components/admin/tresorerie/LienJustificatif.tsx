'use client';

import { obtenirUrlJustificatifAction } from '@/app/actions/justificatif';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

/**
 * Lien cliquable vers un justificatif (V2.3.35).
 *
 * Au clic : appelle `obtenirUrlJustificatifAction(chemin)` qui retourne
 * une URL signée 60s, puis ouvre l'URL dans un nouvel onglet. Évite
 * d'exposer le bucket Supabase publiquement.
 */

interface Props {
  cheminBucket: string;
  nomOriginal: string;
}

export function LienJustificatif({ cheminBucket, nomOriginal }: Props) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const surClic = async (e: React.MouseEvent) => {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const r = await obtenirUrlJustificatifAction(cheminBucket);
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    window.open(r.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={surClic}
        disabled={enCours}
        className="inline-flex items-center gap-1 text-brand text-xs hover:underline disabled:opacity-50"
      >
        <ExternalLink size={12} aria-hidden="true" />
        {enCours ? 'Préparation…' : `Télécharger ${nomOriginal}`}
      </button>
      {erreur !== null && (
        <span role="alert" className="text-danger text-xs">
          {erreur}
        </span>
      )}
    </span>
  );
}

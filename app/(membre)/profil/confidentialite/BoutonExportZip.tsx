'use client';

import { Alert, Button } from '@/components/ui';
import { useState } from 'react';
import { demanderExportZip } from '../actions';

/**
 * Bouton « Télécharger mes données ».
 *
 * Pour 1.3, c'est un stub : la Server Action enregistre la demande et
 * envoie un mail de confirmation. La génération réelle du ZIP arrive à
 * un chantier dédié (cf. ADR-008).
 */
export function BoutonExportZip() {
  const [demande, setDemande] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function gererClic() {
    setErreur(null);
    setEnCours(true);
    const resultat = await demanderExportZip();
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setDemande(true);
  }

  if (demande) {
    return (
      <Alert variant="success" titre="Demande enregistrée">
        Tu recevras un mail avec le lien de téléchargement sous 24h.
      </Alert>
    );
  }

  return (
    <div className="grid gap-3">
      {erreur !== null ? (
        <Alert variant="danger" titre="Demande impossible">
          {erreur}
        </Alert>
      ) : null}
      <Button variant="outline" onClick={gererClic} disabled={enCours}>
        {enCours ? 'Demande en cours...' : 'Télécharger mes données (ZIP)'}
      </Button>
    </div>
  );
}

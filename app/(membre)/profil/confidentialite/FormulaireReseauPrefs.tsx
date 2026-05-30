'use client';

import { Alert, Button } from '@/components/ui';
import type { PreferencesReseau } from '@/lib/validations/profil';
import { useState } from 'react';
import { mettreAJourPreferencesReseau } from '../actions';

interface FormulaireReseauPrefsProps {
  valeursInitiales: PreferencesReseau;
}

/**
 * Verrous d'ouverture du réseau social (épopée réseau V2, chantier D.2) :
 * autoriser ou non les demandes d'ami·e et les messages de n'importe qui.
 * Par défaut les deux sont fermés (on resserre, cf. spec §3 et §4).
 */
export function FormulaireReseauPrefs({ valeursInitiales }: FormulaireReseauPrefsProps) {
  const [valeurs, setValeurs] = useState<PreferencesReseau>(valeursInitiales);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  function basculer(cle: keyof PreferencesReseau) {
    setValeurs((courants) => ({ ...courants, [cle]: !courants[cle] }));
    setSucces(false);
  }

  async function onSubmit(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setSucces(false);
    setEnvoiEnCours(true);
    const resultat = await mettreAJourPreferencesReseau(valeurs);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" aria-label="Ouverture du réseau social">
      {erreur !== null ? (
        <Alert variant="danger" titre="Sauvegarde impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Préférences enregistrées">
          Tes réglages d’ouverture du réseau sont à jour.
        </Alert>
      ) : null}

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={valeurs.demande_ami_ouverte}
          onChange={() => basculer('demande_ami_ouverte')}
          className="mt-1 h-4 w-4 shrink-0 accent-brand"
        />
        <span className="text-sm">
          <span className="font-bold text-text-1">
            Autoriser les demandes d’ami·e de tout le monde
          </span>
          <span className="block text-text-3">
            Décoché (défaut) : seules les personnes que tu suis peuvent te demander en ami·e.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={valeurs.messagerie_ouverte}
          onChange={() => basculer('messagerie_ouverte')}
          className="mt-1 h-4 w-4 shrink-0 accent-brand"
        />
        <span className="text-sm">
          <span className="font-bold text-text-1">Autoriser les messages de tout le monde</span>
          <span className="block text-text-3">
            Décoché (défaut) : seul·es tes ami·es peuvent t’envoyer un message.
          </span>
        </span>
      </label>

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Envoi en cours...' : 'Enregistrer les réglages réseau'}
      </Button>
    </form>
  );
}

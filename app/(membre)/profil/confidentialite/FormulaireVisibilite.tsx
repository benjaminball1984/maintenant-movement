'use client';

import { Alert, Button, Label } from '@/components/ui';
import {
  CHAMPS_VISIBILITE,
  type ChampVisibilite,
  NIVEAUX_VISIBILITE,
  type NiveauVisibilite,
  type PreferencesVisibilite,
} from '@/lib/validations/profil';
import { useState } from 'react';
import { mettreAJourPreferencesVisibilite } from '../actions';

const LIBELLES_CHAMPS: Record<ChampVisibilite, string> = {
  nom: 'Nom',
  prenom: 'Prénom',
  pronom: 'Pronom',
  code_postal: 'Code postal',
  telephone: 'Téléphone',
  photo_url: 'Photo de profil',
  bio: 'Bio',
};

const LIBELLES_NIVEAUX: Record<NiveauVisibilite, string> = {
  publique: 'Public (tout le web)',
  membres: 'Membres connecté·es seulement',
  amies: 'Mes ami·es seulement',
  privee: 'Privé (moi seul·e)',
};

interface FormulaireVisibiliteProps {
  valeursInitiales: PreferencesVisibilite;
}

/**
 * Préférences de visibilité par champ.
 *
 * 7 champs × 4 niveaux. Quand un champ n'a pas de préférence stockée,
 * le défaut applicatif est `membres` (visible aux personnes connectées).
 */
export function FormulaireVisibilite({ valeursInitiales }: FormulaireVisibiliteProps) {
  const [valeurs, setValeurs] = useState<PreferencesVisibilite>(valeursInitiales);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  function changer(champ: ChampVisibilite, niveau: NiveauVisibilite) {
    setValeurs((courants) => ({ ...courants, [champ]: niveau }));
    setSucces(false);
  }

  async function onSubmit(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setSucces(false);
    setEnvoiEnCours(true);
    const resultat = await mettreAJourPreferencesVisibilite(valeurs);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" aria-label="Visibilité par champ">
      {erreur !== null ? (
        <Alert variant="danger" titre="Sauvegarde impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Préférences enregistrées">
          La visibilité de tes champs est à jour.
        </Alert>
      ) : null}

      <div className="grid gap-3">
        {CHAMPS_VISIBILITE.map((champ) => {
          const id = `vis-${champ}`;
          const valeurActuelle = valeurs[champ] ?? 'membres';
          return (
            <div key={champ} className="grid gap-1 sm:grid-cols-[1fr_2fr] sm:items-center">
              <Label htmlFor={id} className="m-0">
                {LIBELLES_CHAMPS[champ]}
              </Label>
              <select
                id={id}
                value={valeurActuelle}
                onChange={(e) => changer(champ, e.target.value as NiveauVisibilite)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1"
              >
                {NIVEAUX_VISIBILITE.map((niveau) => (
                  <option key={niveau} value={niveau}>
                    {LIBELLES_NIVEAUX[niveau]}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Envoi en cours...' : 'Enregistrer la visibilité'}
      </Button>
    </form>
  );
}

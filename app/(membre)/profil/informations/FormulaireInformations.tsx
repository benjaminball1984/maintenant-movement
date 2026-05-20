'use client';

import { Alert, Button, Heading, Input, Label, Textarea } from '@/components/ui';
import { type DonneesMiseAJourProfil, mettreAJourProfilSchema } from '@/lib/validations/profil';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { mettreAJourProfil } from '../actions';

interface FormulaireInformationsProps {
  valeursInitiales: DonneesMiseAJourProfil;
}

/**
 * Formulaire d'édition des informations de profil.
 * Pré-rempli avec les valeurs serveur.
 */
export function FormulaireInformations({ valeursInitiales }: FormulaireInformationsProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonneesMiseAJourProfil>({
    resolver: zodResolver(mettreAJourProfilSchema),
    defaultValues: valeursInitiales,
  });

  async function onSubmit(donnees: DonneesMiseAJourProfil) {
    setErreur(null);
    setSucces(false);
    setEnvoiEnCours(true);
    const resultat = await mettreAJourProfil(donnees);
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4"
      aria-label="Modifier mes informations"
    >
      {erreur !== null ? (
        <Alert variant="danger" titre="Sauvegarde impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Modifications enregistrées">
          Tes informations sont à jour.
        </Alert>
      ) : null}

      <section>
        <Heading niveau={3} className="mb-3 text-lg">
          Identité
        </Heading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="inf-prenom" obligatoire>
              Prénom
            </Label>
            <Input id="inf-prenom" {...register('prenom')} />
            {errors.prenom !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.prenom.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="inf-nom" obligatoire>
              Nom
            </Label>
            <Input id="inf-nom" {...register('nom')} />
            {errors.nom !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="inf-pronom" obligatoire>
            Pronom
          </Label>
          <Input id="inf-pronom" {...register('pronom')} />
          {errors.pronom !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.pronom.message}</p>
          ) : null}
        </div>
      </section>

      <section>
        <Heading niveau={3} className="mb-3 text-lg">
          Coordonnées
        </Heading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="inf-code-postal" obligatoire>
              Code postal
            </Label>
            <Input
              id="inf-code-postal"
              inputMode="numeric"
              maxLength={5}
              {...register('code_postal')}
            />
            {errors.code_postal !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.code_postal.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="inf-telephone">Téléphone (optionnel)</Label>
            <Input id="inf-telephone" type="tel" {...register('telephone')} />
            {errors.telephone !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.telephone.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <Heading niveau={3} className="mb-3 text-lg">
          Présentation publique
        </Heading>
        <div>
          <Label htmlFor="inf-photo">Photo de profil (URL)</Label>
          <Input id="inf-photo" type="url" {...register('photo_url')} />
          {errors.photo_url !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.photo_url.message}</p>
          ) : null}
        </div>
        <div className="mt-4">
          <Label htmlFor="inf-bio">Bio courte (500 caractères max)</Label>
          <Textarea id="inf-bio" rows={4} {...register('bio')} />
          {errors.bio !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.bio.message}</p>
          ) : null}
        </div>
      </section>

      <section>
        <Heading niveau={3} className="mb-3 text-lg">
          Préférence d’interface
        </Heading>
        <div>
          <Label htmlFor="inf-theme">Thème par défaut</Label>
          <select
            id="inf-theme"
            className="block w-full rounded-md border border-border bg-surface px-4 py-2.5 font-body text-base text-text-1"
            {...register('mode_theme')}
          >
            <option value="auto">Automatique (suit le système)</option>
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </div>
      </section>

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Envoi en cours...' : 'Enregistrer les modifications'}
      </Button>
    </form>
  );
}

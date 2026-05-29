'use client';

import { Alert, Button, Heading, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_PROFIL_DEFAUT,
  type MessagesValidationProfil,
} from '@/lib/messages-validation';
import {
  type DonneesMiseAJourProfil,
  creerMettreAJourProfilSchema,
} from '@/lib/validations/profil';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { mettreAJourProfil } from '../actions';

/** Libelles surchargeables admin via CMS (V2.4.138). */
export interface LibellesInformations {
  alertErreurTitre: string;
  alertSuccesTitre: string;
  alertSuccesMessage: string;
  sectionIdentite: string;
  labelPrenom: string;
  labelNom: string;
  labelPronom: string;
  sectionCoordonnees: string;
  labelCodePostal: string;
  labelTelephone: string;
  sectionPresentation: string;
  labelPhoto: string;
  labelCover: string;
  labelBio: string;
  sectionPreference: string;
  labelTheme: string;
  themeAuto: string;
  themeClair: string;
  themeSombre: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesInformations = {
  alertErreurTitre: 'Sauvegarde impossible',
  alertSuccesTitre: 'Modifications enregistrées',
  alertSuccesMessage: 'Tes informations sont à jour.',
  sectionIdentite: 'Identité',
  labelPrenom: 'Prénom',
  labelNom: 'Nom',
  labelPronom: 'Pronom',
  sectionCoordonnees: 'Coordonnées',
  labelCodePostal: 'Code postal',
  labelTelephone: 'Téléphone (optionnel)',
  sectionPresentation: 'Présentation publique',
  labelPhoto: 'Photo de profil (URL)',
  labelCover: 'Image de couverture du profil (URL, optionnel)',
  labelBio: 'Bio courte (500 caractères max)',
  sectionPreference: 'Préférence d’interface',
  labelTheme: 'Thème par défaut',
  themeAuto: 'Automatique (suit le système)',
  themeClair: 'Clair',
  themeSombre: 'Sombre',
  ctaSubmit: 'Enregistrer les modifications',
  ctaEnCours: 'Envoi en cours...',
};

interface FormulaireInformationsProps {
  valeursInitiales: DonneesMiseAJourProfil;
  libelles?: LibellesInformations;
  messages?: MessagesValidationProfil;
}

/**
 * Formulaire d'édition des informations de profil.
 * Pré-rempli avec les valeurs serveur.
 */
export function FormulaireInformations({
  valeursInitiales,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_PROFIL_DEFAUT,
}: FormulaireInformationsProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonneesMiseAJourProfil>({
    resolver: zodResolver(creerMettreAJourProfilSchema(messages)),
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre={libelles.alertSuccesTitre}>
          {libelles.alertSuccesMessage}
        </Alert>
      ) : null}

      <section>
        <Heading niveau={3} className="mb-3 text-lg">
          {libelles.sectionIdentite}
        </Heading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="inf-prenom" obligatoire>
              {libelles.labelPrenom}
            </Label>
            <Input id="inf-prenom" {...register('prenom')} />
            {errors.prenom !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.prenom.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="inf-nom" obligatoire>
              {libelles.labelNom}
            </Label>
            <Input id="inf-nom" {...register('nom')} />
            {errors.nom !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="inf-pronom" obligatoire>
            {libelles.labelPronom}
          </Label>
          <Input id="inf-pronom" {...register('pronom')} />
          {errors.pronom !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.pronom.message}</p>
          ) : null}
        </div>
      </section>

      <section>
        <Heading niveau={3} className="mb-3 text-lg">
          {libelles.sectionCoordonnees}
        </Heading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="inf-code-postal" obligatoire>
              {libelles.labelCodePostal}
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
            <Label htmlFor="inf-telephone">{libelles.labelTelephone}</Label>
            <Input id="inf-telephone" type="tel" {...register('telephone')} />
            {errors.telephone !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.telephone.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <Heading niveau={3} className="mb-3 text-lg">
          {libelles.sectionPresentation}
        </Heading>
        <div>
          <Label htmlFor="inf-photo">{libelles.labelPhoto}</Label>
          <Input id="inf-photo" type="url" {...register('photo_url')} />
          {errors.photo_url !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.photo_url.message}</p>
          ) : null}
        </div>
        <div className="mt-4">
          <Label htmlFor="inf-cover">{libelles.labelCover}</Label>
          <Input id="inf-cover" type="url" placeholder="https://..." {...register('cover_url')} />
          {errors.cover_url !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.cover_url.message}</p>
          ) : null}
        </div>
        <div className="mt-4">
          <Label htmlFor="inf-bio">{libelles.labelBio}</Label>
          <Textarea id="inf-bio" rows={4} {...register('bio')} />
          {errors.bio !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.bio.message}</p>
          ) : null}
        </div>
      </section>

      <section>
        <Heading niveau={3} className="mb-3 text-lg">
          {libelles.sectionPreference}
        </Heading>
        <div>
          <Label htmlFor="inf-theme">{libelles.labelTheme}</Label>
          <select
            id="inf-theme"
            className="block w-full rounded-md border border-border bg-surface px-4 py-2.5 font-body text-base text-text-1"
            {...register('mode_theme')}
          >
            <option value="auto">{libelles.themeAuto}</option>
            <option value="light">{libelles.themeClair}</option>
            <option value="dark">{libelles.themeSombre}</option>
          </select>
        </div>
      </section>

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

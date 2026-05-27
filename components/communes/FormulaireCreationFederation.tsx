'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_COMMUNES_DEFAUT,
  type MessagesValidationCommunes,
} from '@/lib/messages-validation';
import { type DonneesCreerFederation, creerFederationFactory } from '@/lib/validations/communes';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.149). */
export interface LibellesCreationFederation {
  alertErreurTitre: string;
  labelNom: string;
  placeholderNom: string;
  legendeType: string;
  typeGeographique: string;
  typeThematique: string;
  typeMixte: string;
  labelDescription: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationFederation = {
  alertErreurTitre: 'Création impossible',
  labelNom: 'Nom de la fédération',
  placeholderNom: 'Exemple : Fédération des quartiers et villes populaires',
  legendeType: 'Type',
  typeGeographique: 'Géographique',
  typeThematique: 'Thématique',
  typeMixte: 'Mixte',
  labelDescription: 'Description courte (optionnel)',
  ctaSubmit: 'Créer la fédération',
  ctaEnCours: 'Création...',
};

interface FormulaireCreationFederationProps {
  creerFederation: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationFederation;
  messages?: MessagesValidationCommunes;
}

export function FormulaireCreationFederation({
  creerFederation,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_COMMUNES_DEFAUT,
}: FormulaireCreationFederationProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerFederation>({
    resolver: zodResolver(creerFederationFactory(messages)),
    defaultValues: {
      nom: '',
      type: 'mixte',
      description_courte: '',
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerFederation) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerFederation(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/agir/federations/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="fede-nom" obligatoire>
          {libelles.labelNom}
        </Label>
        <Input id="fede-nom" placeholder={libelles.placeholderNom} {...register('nom')} />
        {errors.nom !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
        ) : null}
      </div>
      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeType}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ['geographique', libelles.typeGeographique],
              ['thematique', libelles.typeThematique],
              ['mixte', libelles.typeMixte],
            ] as const
          ).map(([valeur, label]) => (
            <label
              key={valeur}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
            >
              <input type="radio" value={valeur} {...register('type')} className="accent-brand" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="fede-description">{libelles.labelDescription}</Label>
        <Textarea id="fede-description" rows={3} {...register('description_courte')} />
      </div>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

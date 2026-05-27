'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_COMMUNES_DEFAUT,
  type MessagesValidationCommunes,
} from '@/lib/messages-validation';
import {
  type DonneesCreerCommuneLibre,
  creerCommuneLibreFactory,
} from '@/lib/validations/communes';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.149). */
export interface LibellesCreationCommuneLibre {
  alertErreurTitre: string;
  labelNom: string;
  placeholderNom: string;
  labelDescription: string;
  labelCodePostal: string;
  placeholderCodePostal: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationCommuneLibre = {
  alertErreurTitre: 'Création impossible',
  labelNom: 'Nom',
  placeholderNom: 'Exemple : Commune libre d’Orgemont',
  labelDescription: 'Description courte (optionnel)',
  labelCodePostal: 'Code postal (optionnel)',
  placeholderCodePostal: '75020',
  ctaSubmit: 'Créer la commune libre',
  ctaEnCours: 'Création...',
};

interface FormulaireCreationCommuneLibreProps {
  creerCommuneLibre: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationCommuneLibre;
  messages?: MessagesValidationCommunes;
}

export function FormulaireCreationCommuneLibre({
  creerCommuneLibre,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_COMMUNES_DEFAUT,
}: FormulaireCreationCommuneLibreProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerCommuneLibre>({
    resolver: zodResolver(creerCommuneLibreFactory(messages)),
    defaultValues: {
      nom: '',
      description_courte: '',
      code_postal_principal: '',
      latitude: null,
      longitude: null,
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerCommuneLibre) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerCommuneLibre(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/agir/communes/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="commune-nom" obligatoire>
          {libelles.labelNom}
        </Label>
        <Input id="commune-nom" placeholder={libelles.placeholderNom} {...register('nom')} />
        {errors.nom !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="commune-description">{libelles.labelDescription}</Label>
        <Textarea id="commune-description" rows={3} {...register('description_courte')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="commune-cp">{libelles.labelCodePostal}</Label>
          <Input
            id="commune-cp"
            placeholder={libelles.placeholderCodePostal}
            {...register('code_postal_principal')}
          />
          {errors.code_postal_principal !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.code_postal_principal.message}</p>
          ) : null}
        </div>
      </div>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

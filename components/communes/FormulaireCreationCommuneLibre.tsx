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

interface FormulaireCreationCommuneLibreProps {
  creerCommuneLibre: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  messages?: MessagesValidationCommunes;
}

export function FormulaireCreationCommuneLibre({
  creerCommuneLibre,
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
        <Alert variant="danger" titre="Création impossible">
          {erreur}
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="commune-nom" obligatoire>
          Nom
        </Label>
        <Input
          id="commune-nom"
          placeholder="Exemple : Commune libre d’Orgemont"
          {...register('nom')}
        />
        {errors.nom !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="commune-description">Description courte (optionnel)</Label>
        <Textarea id="commune-description" rows={3} {...register('description_courte')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="commune-cp">Code postal (optionnel)</Label>
          <Input id="commune-cp" placeholder="75020" {...register('code_postal_principal')} />
          {errors.code_postal_principal !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.code_postal_principal.message}</p>
          ) : null}
        </div>
      </div>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Création...' : 'Créer la commune libre'}
      </Button>
    </form>
  );
}

'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { type DonneesCreerFederation, creerFederationSchema } from '@/lib/validations/communes';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireCreationFederationProps {
  creerFederation: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
}

export function FormulaireCreationFederation({
  creerFederation,
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
    resolver: zodResolver(creerFederationSchema),
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
        <Alert variant="danger" titre="Création impossible">
          {erreur}
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="fede-nom" obligatoire>
          Nom de la fédération
        </Label>
        <Input
          id="fede-nom"
          placeholder="Exemple : Fédération des quartiers et villes populaires"
          {...register('nom')}
        />
        {errors.nom !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
        ) : null}
      </div>
      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">Type</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(['geographique', 'thematique', 'mixte'] as const).map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
            >
              <input type="radio" value={t} {...register('type')} className="accent-brand" />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="fede-description">Description courte (optionnel)</Label>
        <Textarea id="fede-description" rows={3} {...register('description_courte')} />
      </div>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Création...' : 'Créer la fédération'}
      </Button>
    </form>
  );
}

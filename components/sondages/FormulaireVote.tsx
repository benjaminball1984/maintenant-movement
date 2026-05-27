'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_SONDAGES_DEFAUT,
  type MessagesValidationSondages,
} from '@/lib/messages-validation';
import { type DonneesVoterSondage, creerVoterSondageSchema } from '@/lib/validations/sondages';
import type { ModeSondage } from '@/types/database';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireVoteProps {
  sondageId: string;
  options: string[];
  mode: ModeSondage;
  voterSondage: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  messages?: MessagesValidationSondages;
}

/**
 * Formulaire de vote. En mode pondéré, on affiche aussi les champs
 * sociodémo optionnels (la personne peut refuser).
 */
export function FormulaireVote({
  sondageId,
  options,
  mode,
  voterSondage,
  messages = MESSAGES_VALIDATION_SONDAGES_DEFAUT,
}: FormulaireVoteProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesVoterSondage>({
    resolver: zodResolver(creerVoterSondageSchema(messages)),
    defaultValues: {
      sondage_id: sondageId,
      option_index: 0,
      code_postal: '',
      pronom: '',
      genre_declare: '',
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesVoterSondage) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await voterSondage(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...register('sondage_id')} />
      {erreur !== null ? (
        <Alert variant="danger" titre="Vote impossible">
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">Ton vote</legend>
        <div className="grid gap-2">
          {options.map((opt, index) => (
            <label
              key={`${index}-${opt}`}
              className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
            >
              <input
                type="radio"
                value={index}
                {...register('option_index', { valueAsNumber: true })}
                className="mt-0.5 accent-brand"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {errors.option_index !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.option_index.message}</p>
        ) : null}
      </fieldset>

      {mode === 'pondere' ? (
        <details className="rounded-md border border-border bg-surface-2 p-3">
          <summary className="cursor-pointer text-sm font-bold text-text-1">
            Variables sociodémo (optionnel — méthode des quotas)
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="vote-cp">Code postal</Label>
              <Input id="vote-cp" placeholder="75020" {...register('code_postal')} />
            </div>
            <div>
              <Label htmlFor="vote-age">Tranche d'âge</Label>
              <select
                id="vote-age"
                {...register('tranche_age')}
                className="w-full rounded-sm border border-border bg-surface p-2 text-sm"
              >
                <option value="">—</option>
                <option value="moins_18">Moins de 18 ans</option>
                <option value="18_24">18-24 ans</option>
                <option value="25_34">25-34 ans</option>
                <option value="35_49">35-49 ans</option>
                <option value="50_64">50-64 ans</option>
                <option value="65_plus">65 ans et plus</option>
              </select>
            </div>
            <div>
              <Label htmlFor="vote-pronom">Pronom</Label>
              <Input id="vote-pronom" placeholder="iel / il / elle / ..." {...register('pronom')} />
            </div>
            <div>
              <Label htmlFor="vote-genre">Genre déclaré</Label>
              <Input id="vote-genre" {...register('genre_declare')} />
            </div>
          </div>
          <p className="mt-2 text-xs text-text-3">
            Toutes ces variables sont optionnelles. Elles permettent la pondération par quotas
            (méthode redressement) dès 300 répondant·es.
          </p>
        </details>
      ) : null}

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Vote en cours...' : 'Voter'}
      </Button>
    </form>
  );
}

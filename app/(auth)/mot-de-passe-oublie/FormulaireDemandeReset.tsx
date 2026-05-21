'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import { type DonneesDemandeReset, demandeResetSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { demanderResetMotDePasse } from '../actions';

/**
 * Formulaire de demande de reinitialisation du mot de passe.
 *
 * Saisie d'un email + Turnstile. Apres soumission, redirection vers
 * /verifier-email avec un message generique (anti-enumeration).
 */
export function FormulaireDemandeReset() {
  const router = useRouter();
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [hydrate, setHydrate] = useState(false);
  useEffect(() => {
    setHydrate(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesDemandeReset>({
    resolver: zodResolver(demandeResetSchema),
    defaultValues: { token_turnstile: '' },
  });

  async function onSubmit(donnees: DonneesDemandeReset) {
    setErreurServeur(null);
    setEnvoiEnCours(true);
    const resultat = await demanderResetMotDePasse(donnees);
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreurServeur(resultat.message);
      return;
    }
    if (resultat.redirectVers !== undefined) {
      router.push(resultat.redirectVers);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3"
      aria-label="Demande de reinitialisation"
    >
      {erreurServeur !== null ? (
        <Alert variant="danger" titre="Envoi impossible">
          {erreurServeur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="reset-email" obligatoire>
          Email
        </Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        {errors.email !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours || !hydrate}>
        {envoiEnCours
          ? 'Envoi en cours...'
          : !hydrate
            ? 'Chargement…'
            : 'Recevoir un lien de réinitialisation'}
      </Button>
    </form>
  );
}

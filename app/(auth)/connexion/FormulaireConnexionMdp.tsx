'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import { type DonneesConnexionMdp, connexionMdpSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { connecterAvecMotDePasse } from '../actions';

/**
 * Connexion par email + mot de passe (porte 1 sur 4).
 */
export function FormulaireConnexionMdp() {
  const router = useRouter();
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesConnexionMdp>({
    resolver: zodResolver(connexionMdpSchema),
    defaultValues: { token_turnstile: '' },
  });

  async function onSubmit(donnees: DonneesConnexionMdp) {
    setErreurServeur(null);
    setEnvoiEnCours(true);
    const resultat = await connecterAvecMotDePasse(donnees);
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
      aria-label="Connexion par mot de passe"
    >
      {erreurServeur !== null ? (
        <Alert variant="danger" titre="Connexion impossible">
          {erreurServeur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="cnx-mdp-email" obligatoire>
          Email
        </Label>
        <Input
          id="cnx-mdp-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        {errors.email !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="cnx-mdp-passe" obligatoire>
          Mot de passe
        </Label>
        <Input
          id="cnx-mdp-passe"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.mot_de_passe !== undefined}
          {...register('mot_de_passe')}
        />
        {errors.mot_de_passe !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.mot_de_passe.message}</p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Connexion en cours...' : 'Se connecter'}
      </Button>
    </form>
  );
}

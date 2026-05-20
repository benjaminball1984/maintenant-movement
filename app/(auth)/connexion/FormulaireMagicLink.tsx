'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import { type DonneesMagicLink, magicLinkSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { envoyerMagicLink } from '../actions';

/**
 * Connexion par lien magique : envoi d'un email avec lien à usage unique
 * (porte 2 sur 4). Pas de mot de passe à mémoriser.
 */
export function FormulaireMagicLink() {
  const router = useRouter();
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesMagicLink>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { token_turnstile: '' },
  });

  async function onSubmit(donnees: DonneesMagicLink) {
    setErreurServeur(null);
    setEnvoiEnCours(true);
    const resultat = await envoyerMagicLink(donnees);
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
      aria-label="Connexion par lien magique"
    >
      {erreurServeur !== null ? (
        <Alert variant="danger" titre="Envoi impossible">
          {erreurServeur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="cnx-magic-email" obligatoire>
          Email
        </Label>
        <Input
          id="cnx-magic-email"
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

      <Button variant="ghost" type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Envoi en cours...' : 'Recevoir un lien par email'}
      </Button>
    </form>
  );
}

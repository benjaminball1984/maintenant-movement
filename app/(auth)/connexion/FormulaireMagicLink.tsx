'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_AUTH_DEFAUT,
  type MessagesValidationAuth,
} from '@/lib/messages-validation';
import { type DonneesMagicLink, creerMagicLinkSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { envoyerMagicLink } from '../actions';

/** Libelles surchargeables admin via CMS (V2.4.135 + V2.4.137). */
export interface LibellesMagicLink {
  ctaSubmit: string;
  ctaEnCours: string;
  ctaChargement: string;
  labelEmail: string;
  alertErreurTitre: string;
}

const LIBELLES_DEFAUT: LibellesMagicLink = {
  ctaSubmit: 'Recevoir un lien par email',
  ctaEnCours: 'Envoi en cours...',
  ctaChargement: 'Chargement…',
  labelEmail: 'Email',
  alertErreurTitre: 'Envoi impossible',
};

/**
 * Connexion par lien magique : envoi d'un email avec lien à usage unique
 * (porte 2 sur 4). Pas de mot de passe à mémoriser.
 */
export function FormulaireMagicLink({
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_AUTH_DEFAUT,
}: { libelles?: LibellesMagicLink; messages?: MessagesValidationAuth } = {}) {
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
  } = useForm<DonneesMagicLink>({
    resolver: zodResolver(creerMagicLinkSchema(messages)),
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreurServeur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="cnx-magic-email" obligatoire>
          {libelles.labelEmail}
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

      <Button variant="ghost" type="submit" disabled={envoiEnCours || !hydrate}>
        {envoiEnCours
          ? libelles.ctaEnCours
          : !hydrate
            ? libelles.ctaChargement
            : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

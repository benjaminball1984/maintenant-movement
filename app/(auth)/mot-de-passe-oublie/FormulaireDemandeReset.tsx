'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_AUTH_DEFAUT,
  type MessagesValidationAuth,
} from '@/lib/messages-validation';
import { type DonneesDemandeReset, creerDemandeResetSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { demanderResetMotDePasse } from '../actions';

/** Libelles surchargeables admin via CMS (V2.4.142). */
export interface LibellesDemandeReset {
  alertErreurTitre: string;
  labelEmail: string;
  ctaSubmit: string;
  ctaEnCours: string;
  ctaChargement: string;
}

const LIBELLES_DEFAUT: LibellesDemandeReset = {
  alertErreurTitre: 'Envoi impossible',
  labelEmail: 'Email',
  ctaSubmit: 'Recevoir un lien de réinitialisation',
  ctaEnCours: 'Envoi en cours...',
  ctaChargement: 'Chargement…',
};

/**
 * Formulaire de demande de reinitialisation du mot de passe.
 *
 * Saisie d'un email + Turnstile. Apres soumission, redirection vers
 * /verifier-email avec un message generique (anti-enumeration).
 */
export function FormulaireDemandeReset({
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_AUTH_DEFAUT,
}: { libelles?: LibellesDemandeReset; messages?: MessagesValidationAuth } = {}) {
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
    resolver: zodResolver(creerDemandeResetSchema(messages)),
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreurServeur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="reset-email" obligatoire>
          {libelles.labelEmail}
        </Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined ? true : undefined}
          aria-describedby={errors.email !== undefined ? 'reset-email-erreur' : undefined}
          {...register('email')}
        />
        {errors.email !== undefined ? (
          <p id="reset-email-erreur" className="mt-1 text-xs text-danger">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours || !hydrate}>
        {envoiEnCours
          ? libelles.ctaEnCours
          : !hydrate
            ? libelles.ctaChargement
            : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

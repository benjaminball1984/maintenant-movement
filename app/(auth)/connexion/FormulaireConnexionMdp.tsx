'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { ChampMotDePasse } from '@/components/formulaires/ChampMotDePasse';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_AUTH_DEFAUT,
  type MessagesValidationAuth,
} from '@/lib/messages-validation';
import { type DonneesConnexionMdp, creerConnexionMdpSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { connecterAvecMotDePasse } from '../actions';

/** Libelles surchargeables admin via CMS (V2.4.135 + V2.4.137). */
export interface LibellesConnexionMdp {
  ctaSubmit: string;
  ctaEnCours: string;
  ctaChargement: string;
  labelEmail: string;
  labelMotDePasse: string;
  alertErreurTitre: string;
}

const LIBELLES_DEFAUT: LibellesConnexionMdp = {
  ctaSubmit: 'Se connecter',
  ctaEnCours: 'Connexion en cours...',
  ctaChargement: 'Chargement…',
  labelEmail: 'Email',
  labelMotDePasse: 'Mot de passe',
  alertErreurTitre: 'Connexion impossible',
};

/**
 * Connexion par email + mot de passe (porte 1 sur 4).
 */
export function FormulaireConnexionMdp({
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_AUTH_DEFAUT,
}: { libelles?: LibellesConnexionMdp; messages?: MessagesValidationAuth } = {}) {
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
  } = useForm<DonneesConnexionMdp>({
    resolver: zodResolver(creerConnexionMdpSchema(messages)),
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreurServeur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="cnx-mdp-email" obligatoire>
          {libelles.labelEmail}
        </Label>
        <Input
          id="cnx-mdp-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined ? true : undefined}
          aria-describedby={errors.email !== undefined ? 'cnx-mdp-email-erreur' : undefined}
          {...register('email')}
        />
        {errors.email !== undefined ? (
          <p id="cnx-mdp-email-erreur" className="mt-1 text-xs text-danger">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="cnx-mdp-passe" obligatoire>
          {libelles.labelMotDePasse}
        </Label>
        <ChampMotDePasse
          id="cnx-mdp-passe"
          autoComplete="current-password"
          aria-invalid={errors.mot_de_passe !== undefined ? true : undefined}
          aria-describedby={errors.mot_de_passe !== undefined ? 'cnx-mdp-passe-erreur' : undefined}
          {...register('mot_de_passe')}
        />
        {errors.mot_de_passe !== undefined ? (
          <p id="cnx-mdp-passe-erreur" className="mt-1 text-xs text-danger">
            {errors.mot_de_passe.message}
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

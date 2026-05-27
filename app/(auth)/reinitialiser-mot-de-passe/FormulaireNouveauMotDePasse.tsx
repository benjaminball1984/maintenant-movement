'use client';

import { ChampMotDePasse } from '@/components/formulaires/ChampMotDePasse';
import { Alert, Button, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_AUTH_DEFAUT,
  type MessagesValidationAuth,
} from '@/lib/messages-validation';
import {
  type DonneesNouveauMotDePasse,
  creerNouveauMotDePasseSchema,
} from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { definirNouveauMotDePasse } from '../actions';

/** Libelles surchargeables admin via CMS (V2.4.142). */
export interface LibellesNouveauMotDePasse {
  alertErreurTitre: string;
  labelMotDePasse: string;
  ctaSubmit: string;
  ctaEnCours: string;
  ctaChargement: string;
}

const LIBELLES_DEFAUT: LibellesNouveauMotDePasse = {
  alertErreurTitre: 'Impossible de définir le mot de passe',
  labelMotDePasse: 'Nouveau mot de passe',
  ctaSubmit: 'Enregistrer le nouveau mot de passe',
  ctaEnCours: 'Enregistrement...',
  ctaChargement: 'Chargement…',
};

/**
 * Formulaire de definition du nouveau mot de passe.
 *
 * Pas de Turnstile : on est deja authentifie par la session temporaire
 * issue du clic sur le lien email.
 */
export function FormulaireNouveauMotDePasse({
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_AUTH_DEFAUT,
}: { libelles?: LibellesNouveauMotDePasse; messages?: MessagesValidationAuth } = {}) {
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
    formState: { errors },
  } = useForm<DonneesNouveauMotDePasse>({
    resolver: zodResolver(creerNouveauMotDePasseSchema(messages)),
  });

  async function onSubmit(donnees: DonneesNouveauMotDePasse) {
    setErreurServeur(null);
    setEnvoiEnCours(true);
    const resultat = await definirNouveauMotDePasse(donnees);
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
      aria-label="Nouveau mot de passe"
    >
      {erreurServeur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreurServeur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="reset-mdp" obligatoire>
          {libelles.labelMotDePasse}
        </Label>
        <ChampMotDePasse
          id="reset-mdp"
          autoComplete="new-password"
          aria-invalid={errors.mot_de_passe !== undefined}
          {...register('mot_de_passe')}
        />
        {errors.mot_de_passe !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.mot_de_passe.message}</p>
        ) : null}
      </div>

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

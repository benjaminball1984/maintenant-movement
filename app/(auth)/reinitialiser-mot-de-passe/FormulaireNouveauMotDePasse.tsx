'use client';

import { ChampMotDePasse } from '@/components/formulaires/ChampMotDePasse';
import { Alert, Button, Label } from '@/components/ui';
import { type DonneesNouveauMotDePasse, nouveauMotDePasseSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { definirNouveauMotDePasse } from '../actions';

/**
 * Formulaire de definition du nouveau mot de passe.
 *
 * Pas de Turnstile : on est deja authentifie par la session temporaire
 * issue du clic sur le lien email.
 */
export function FormulaireNouveauMotDePasse() {
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
    resolver: zodResolver(nouveauMotDePasseSchema),
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
        <Alert variant="danger" titre="Impossible de définir le mot de passe">
          {erreurServeur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="reset-mdp" obligatoire>
          Nouveau mot de passe
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
          ? 'Enregistrement...'
          : !hydrate
            ? 'Chargement…'
            : 'Enregistrer le nouveau mot de passe'}
      </Button>
    </form>
  );
}

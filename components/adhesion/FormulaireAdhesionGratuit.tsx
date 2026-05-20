'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button } from '@/components/ui';
import { type DonneesAdhererGratuit, adhererGratuitSchema } from '@/lib/validations/adhesion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireAdhesionGratuitProps {
  adhererGratuit: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
}

/**
 * Formulaire du chemin « Adhésion gratuite ». Pas de montant, juste
 * Turnstile + bouton. Cohérent avec la doctrine §7A : on entre dans
 * le mouvement sans barrière financière.
 */
export function FormulaireAdhesionGratuit({ adhererGratuit }: FormulaireAdhesionGratuitProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesAdhererGratuit>({
    resolver: zodResolver(adhererGratuitSchema),
    defaultValues: { token_turnstile: '' },
  });

  async function onSubmit(donnees: DonneesAdhererGratuit) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await adhererGratuit(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
    router.refresh();
  }

  if (succes) {
    return (
      <Alert variant="success" titre="Bienvenue dans Maintenant!">
        Ton adhésion gratuite est active pour 365 jours. On te rappelle pour le renouvellement par
        mail le moment venu.
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {erreur !== null ? (
        <Alert variant="danger" titre="Adhésion impossible">
          {erreur}
        </Alert>
      ) : null}
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      {errors.token_turnstile !== undefined ? (
        <p className="text-xs text-danger">{errors.token_turnstile.message}</p>
      ) : null}
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Adhésion en cours...' : 'Adhérer gratuitement'}
      </Button>
    </form>
  );
}

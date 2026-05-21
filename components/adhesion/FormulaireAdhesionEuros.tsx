'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button } from '@/components/ui';
import {
  type DonneesAdhererEuros,
  MONTANT_ADHESION_EUR_CENTIMES,
  adhererEurosSchema,
} from '@/lib/validations/adhesion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireAdhesionEurosProps {
  adhererEuros: (
    donnees: unknown,
  ) => Promise<{ ok: true; urlRedirection: string } | { ok: false; message: string }>;
}

const FORMATEUR_EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function FormulaireAdhesionEuros({ adhererEuros }: FormulaireAdhesionEurosProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const { handleSubmit, setValue } = useForm<DonneesAdhererEuros>({
    resolver: zodResolver(adhererEurosSchema),
    defaultValues: { token_turnstile: '' },
  });

  async function onSubmit(donnees: DonneesAdhererEuros) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await adhererEuros(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    window.location.assign(resultat.urlRedirection);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {erreur !== null ? (
        <Alert variant="danger" titre="Paiement impossible">
          {erreur}
        </Alert>
      ) : null}
      <p className="text-text-2">
        Adhésion annuelle :{' '}
        <strong className="text-text-1">
          {FORMATEUR_EUR.format(MONTANT_ADHESION_EUR_CENTIMES / 100)}
        </strong>
        . Paiement par carte via Stripe.
      </p>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours
          ? 'Redirection...'
          : `Payer ${FORMATEUR_EUR.format(MONTANT_ADHESION_EUR_CENTIMES / 100)}`}
      </Button>
    </form>
  );
}

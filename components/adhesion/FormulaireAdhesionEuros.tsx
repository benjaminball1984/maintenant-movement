'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button } from '@/components/ui';
import {
  MESSAGES_VALIDATION_ADHESION_DEFAUT,
  type MessagesValidationAdhesion,
} from '@/lib/messages-validation';
import {
  type DonneesAdhererEuros,
  MONTANT_ADHESION_EUR_CENTIMES,
  creerAdhererEurosSchema,
} from '@/lib/validations/adhesion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.144). */
export interface LibellesAdhesionEuros {
  alertErreurTitre: string;
  description: string;
  ctaSubmitPrefixe: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesAdhesionEuros = {
  alertErreurTitre: 'Paiement impossible',
  description: 'Adhésion annuelle : {montant}. Paiement par carte via Stripe.',
  ctaSubmitPrefixe: 'Payer',
  ctaEnCours: 'Redirection...',
};

interface FormulaireAdhesionEurosProps {
  adhererEuros: (
    donnees: unknown,
  ) => Promise<{ ok: true; urlRedirection: string } | { ok: false; message: string }>;
  libelles?: LibellesAdhesionEuros;
  messages?: MessagesValidationAdhesion;
}

const FORMATEUR_EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function FormulaireAdhesionEuros({
  adhererEuros,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_ADHESION_DEFAUT,
}: FormulaireAdhesionEurosProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const { handleSubmit, setValue } = useForm<DonneesAdhererEuros>({
    resolver: zodResolver(creerAdhererEurosSchema(messages)),
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      <p className="text-text-2">
        {libelles.description.replace(
          '{montant}',
          FORMATEUR_EUR.format(MONTANT_ADHESION_EUR_CENTIMES / 100),
        )}
      </p>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours
          ? libelles.ctaEnCours
          : `${libelles.ctaSubmitPrefixe} ${FORMATEUR_EUR.format(MONTANT_ADHESION_EUR_CENTIMES / 100)}`}
      </Button>
    </form>
  );
}

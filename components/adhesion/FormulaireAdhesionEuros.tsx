'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button } from '@/components/ui';
import { formaterEurosDecimales, formaterEurosEntier } from '@/lib/format-euros';
import {
  MESSAGES_VALIDATION_ADHESION_DEFAUT,
  type MessagesValidationAdhesion,
} from '@/lib/messages-validation';
import { calculerFraisEuros, totalAvecFraisEuros } from '@/lib/payments/frais';
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
  description:
    'Adhésion annuelle : {montant} pour le mouvement. Frais de transaction : +{frais} (3 % + 0,30 €). Total à payer par carte via Stripe : {total}.',
  ctaSubmitPrefixe: 'Payer',
  ctaEnCours: 'Redirection...',
};

/**
 * Adhésion à montant fixe : on calcule une fois les frais (3 % + 0,30 €,
 * à la charge de l'adhérent·e) et le total à payer. L'association reçoit
 * les 12 € pleins ; l'adhérent·e règle 12 € + frais.
 */
const FRAIS_ADHESION_CENTIMES = calculerFraisEuros(MONTANT_ADHESION_EUR_CENTIMES);
const TOTAL_ADHESION_CENTIMES = totalAvecFraisEuros(MONTANT_ADHESION_EUR_CENTIMES);

interface FormulaireAdhesionEurosProps {
  adhererEuros: (
    donnees: unknown,
  ) => Promise<{ ok: true; urlRedirection: string } | { ok: false; message: string }>;
  libelles?: LibellesAdhesionEuros;
  messages?: MessagesValidationAdhesion;
}

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
        {libelles.description
          .replace('{montant}', formaterEurosEntier(MONTANT_ADHESION_EUR_CENTIMES / 100))
          .replace('{frais}', formaterEurosDecimales(FRAIS_ADHESION_CENTIMES / 100))
          .replace('{total}', formaterEurosDecimales(TOTAL_ADHESION_CENTIMES / 100))}
      </p>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours
          ? libelles.ctaEnCours
          : `${libelles.ctaSubmitPrefixe} ${formaterEurosDecimales(TOTAL_ADHESION_CENTIMES / 100)}`}
      </Button>
    </form>
  );
}

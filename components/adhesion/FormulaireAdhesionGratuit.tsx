'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button } from '@/components/ui';
import {
  MESSAGES_VALIDATION_ADHESION_DEFAUT,
  type MessagesValidationAdhesion,
} from '@/lib/messages-validation';
import { type DonneesAdhererGratuit, creerAdhererGratuitSchema } from '@/lib/validations/adhesion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.144). */
export interface LibellesAdhesionGratuit {
  alertErreurTitre: string;
  alertSuccesTitre: string;
  alertSuccesMessage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesAdhesionGratuit = {
  alertErreurTitre: 'Adhésion impossible',
  alertSuccesTitre: 'Bienvenue dans Maintenant!',
  alertSuccesMessage:
    'Ton adhésion gratuite est active pour 365 jours. On te rappelle pour le renouvellement par mail le moment venu.',
  ctaSubmit: 'Adhérer gratuitement',
  ctaEnCours: 'Adhésion en cours...',
};

interface FormulaireAdhesionGratuitProps {
  adhererGratuit: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesAdhesionGratuit;
  messages?: MessagesValidationAdhesion;
}

/**
 * Formulaire du chemin « Adhésion gratuite ». Pas de montant, juste
 * Turnstile + bouton. Cohérent avec la doctrine §7A : on entre dans
 * le mouvement sans barrière financière.
 */
export function FormulaireAdhesionGratuit({
  adhererGratuit,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_ADHESION_DEFAUT,
}: FormulaireAdhesionGratuitProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesAdhererGratuit>({
    resolver: zodResolver(creerAdhererGratuitSchema(messages)),
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
      <Alert variant="success" titre={libelles.alertSuccesTitre}>
        {libelles.alertSuccesMessage}
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      {errors.token_turnstile !== undefined ? (
        <p className="text-xs text-danger">{errors.token_turnstile.message}</p>
      ) : null}
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

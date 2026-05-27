'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_ADHESION_DEFAUT,
  type MessagesValidationAdhesion,
} from '@/lib/messages-validation';
import { type DonneesAdhererT99CP, creerAdhererT99CPSchema } from '@/lib/validations/adhesion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.144). */
export interface LibellesAdhesionT99CP {
  alertErreurTitre: string;
  alertSuccesTitre: string;
  alertSuccesMessage: string;
  description: string;
  labelTxHash: string;
  placeholderTxHash: string;
  hintTxHash: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesAdhesionT99CP = {
  alertErreurTitre: 'Adhésion impossible',
  alertSuccesTitre: 'Adhésion T99CP enregistrée',
  alertSuccesMessage: 'Ton adhésion est active pour 365 jours. Merci.',
  description: 'Adhésion annuelle : **12 99-coin** (12 T99CP). Frais 0 %.',
  labelTxHash: 'Hash de transaction (optionnel en mock)',
  placeholderTxHash: '0x... (64 hex)',
  hintTxHash:
    'En mock, laisser vide : un hash factice sera généré. En prod, le wallet T99CP le fournit.',
  ctaSubmit: 'Adhérer en 12 99-coin',
  ctaEnCours: 'Transaction en cours...',
};

interface FormulaireAdhesionT99CPProps {
  adhererT99CP: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesAdhesionT99CP;
  messages?: MessagesValidationAdhesion;
}

export function FormulaireAdhesionT99CP({
  adhererT99CP,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_ADHESION_DEFAUT,
}: FormulaireAdhesionT99CPProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesAdhererT99CP>({
    resolver: zodResolver(creerAdhererT99CPSchema(messages)),
    defaultValues: { tx_hash: '', token_turnstile: '' },
  });

  async function onSubmit(donnees: DonneesAdhererT99CP) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await adhererT99CP(donnees);
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
      <p className="text-text-2">
        {libelles.description.split(/\*\*([^*]+)\*\*/g).map((segment, i) =>
          // Les segments d'indice impair etaient entoures de ** dans la chaine source.
          i % 2 === 1 ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: rendu lineaire d'une chaine fixe (CMS), pas de reorder
            <strong key={i} className="text-text-1">
              {segment}
            </strong>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: idem
            <span key={i}>{segment}</span>
          ),
        )}
      </p>
      <div>
        <Label htmlFor="adhesion-txhash">{libelles.labelTxHash}</Label>
        <input
          id="adhesion-txhash"
          type="text"
          placeholder={libelles.placeholderTxHash}
          className="w-full rounded-sm border border-border bg-surface p-2 font-mono text-xs"
          {...register('tx_hash')}
        />
        <p className="mt-1 text-xs text-text-3">{libelles.hintTxHash}</p>
        {errors.tx_hash !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.tx_hash.message}</p>
        ) : null}
      </div>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Label } from '@/components/ui';
import { type DonneesAdhererT99CP, adhererT99CPSchema } from '@/lib/validations/adhesion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireAdhesionT99CPProps {
  adhererT99CP: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
}

export function FormulaireAdhesionT99CP({ adhererT99CP }: FormulaireAdhesionT99CPProps) {
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
    resolver: zodResolver(adhererT99CPSchema),
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
      <Alert variant="success" titre="Adhésion T99CP enregistrée">
        Ton adhésion est active pour 365 jours. Merci.
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
      <p className="text-text-2">
        Adhésion annuelle : <strong className="text-text-1">12 99-coin</strong> (12 T99CP). Frais 0
        %.
      </p>
      <div>
        <Label htmlFor="adhesion-txhash">Hash de transaction (optionnel en mock)</Label>
        <input
          id="adhesion-txhash"
          type="text"
          placeholder="0x... (64 hex)"
          className="w-full rounded-sm border border-border bg-surface p-2 font-mono text-xs"
          {...register('tx_hash')}
        />
        <p className="mt-1 text-xs text-text-3">
          En mock, laisser vide : un hash factice sera généré. En prod, le wallet T99CP le fournit.
        </p>
        {errors.tx_hash !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.tx_hash.message}</p>
        ) : null}
      </div>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Transaction en cours...' : 'Adhérer en 12 99-coin'}
      </Button>
    </form>
  );
}

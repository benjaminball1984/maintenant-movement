'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import { type DonneesFaireDonT99CP, faireDonT99CPSchema } from '@/lib/validations/cagnotte';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireDonT99CPProps {
  cagnotteId: string;
  /** Adresse wallet du porteur (affichée à recopier dans le wallet de la donatrice). */
  walletPorteur: string;
  faireDonT99CP: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
}

/**
 * Formulaire de don en T99CP. Workflow simplifié pour 3.3 v1 :
 *   1. La donatrice envoie elle-même la transaction depuis son wallet
 *      vers `walletPorteur` (affiché en clair, copiable).
 *   2. Elle saisit dans le formulaire :
 *      - le `tx_hash` retourné par le wallet,
 *      - le montant envoyé (en T99CP entiers).
 *   3. La Server Action enregistre la ligne `don` au statut `confirme`.
 *
 * Une intégration native via Wallet Connect / MetaMask viendra en
 * polish (chantier 11.x). En attendant, ce mode « collez le tx_hash »
 * marche pour les usager·es Web3 averti·es.
 */
export function FormulaireDonT99CP({
  cagnotteId,
  walletPorteur,
  faireDonT99CP,
}: FormulaireDonT99CPProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [confirme, setConfirme] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesFaireDonT99CP>({
    resolver: zodResolver(faireDonT99CPSchema),
    defaultValues: {
      cagnotte_id: cagnotteId,
      montant_unites: '1',
      tx_hash: '',
      prenom: '',
      nom: '',
      email: '',
      code_postal: '',
      accepte_newsletter: false,
      accepte_contact_createurice: false,
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesFaireDonT99CP) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await faireDonT99CP(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setConfirme(true);
  }

  if (confirme) {
    return (
      <Alert variant="success" titre="Merci pour ton don en 99-coin">
        Ta transaction est enregistrée et abonde la cagnotte. Frais 0 % (politique T99CP).
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {erreur !== null ? (
        <Alert variant="danger" titre="Don impossible">
          {erreur}
        </Alert>
      ) : null}

      <Alert variant="info" titre="Étape 1 : envoie depuis ton wallet">
        Envoie la somme en T99CP depuis ton wallet vers l'adresse de la porteuse :
        <code className="ml-1 inline-block break-all rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
          {walletPorteur}
        </code>
        . Frais 0 % (côté Maintenant!). Une fois la transaction confirmée, recopie ci-dessous le
        tx_hash retourné par ton wallet.
      </Alert>

      <input type="hidden" {...register('cagnotte_id')} />

      <div>
        <Label htmlFor="t99-montant" obligatoire>
          Montant envoyé (en 99-coin entiers)
        </Label>
        <Input
          id="t99-montant"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          {...register('montant_unites')}
        />
        {errors.montant_unites !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.montant_unites.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="t99-tx" obligatoire>
          tx_hash de la transaction
        </Label>
        <Input
          id="t99-tx"
          placeholder="0x..."
          className="font-mono text-xs"
          {...register('tx_hash')}
        />
        {errors.tx_hash !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.tx_hash.message}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="t99-prenom">Prénom (optionnel)</Label>
          <Input id="t99-prenom" {...register('prenom')} />
        </div>
        <div>
          <Label htmlFor="t99-nom">Nom (optionnel)</Label>
          <Input id="t99-nom" {...register('nom')} />
        </div>
      </div>

      <div>
        <Label htmlFor="t99-email">Email (optionnel)</Label>
        <Input id="t99-email" type="email" {...register('email')} />
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Enregistrement...' : 'Enregistrer le don T99CP'}
      </Button>
    </form>
  );
}

'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
  type MessagesValidationCagnotte,
} from '@/lib/messages-validation';
import { type DonneesFaireDonT99CP, creerFaireDonT99CPSchema } from '@/lib/validations/cagnotte';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.145). */
export interface LibellesDonT99CP {
  alertSuccesTitre: string;
  alertSuccesMessage: string;
  alertErreurTitre: string;
  alertEtape1Titre: string;
  alertEtape1Avant: string;
  alertEtape1Apres: string;
  labelMontant: string;
  labelTxHash: string;
  placeholderTxHash: string;
  labelPrenom: string;
  labelNom: string;
  labelEmail: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesDonT99CP = {
  alertSuccesTitre: 'Merci pour ton don en 99-coin',
  alertSuccesMessage:
    'Ta transaction est enregistrée et abonde la cagnotte. Frais 0 % (politique T99CP).',
  alertErreurTitre: 'Don impossible',
  alertEtape1Titre: 'Étape 1 : envoie depuis ton wallet',
  alertEtape1Avant: "Envoie la somme en T99CP depuis ton wallet vers l'adresse de la porteuse :",
  alertEtape1Apres:
    'Frais 0 % (côté Maintenant!). Une fois la transaction confirmée, recopie ci-dessous le tx_hash retourné par ton wallet.',
  labelMontant: 'Montant envoyé (en 99-coin entiers)',
  labelTxHash: 'tx_hash de la transaction',
  placeholderTxHash: '0x...',
  labelPrenom: 'Prénom (optionnel)',
  labelNom: 'Nom (optionnel)',
  labelEmail: 'Email (optionnel)',
  ctaSubmit: 'Enregistrer le don T99CP',
  ctaEnCours: 'Enregistrement...',
};

interface FormulaireDonT99CPProps {
  cagnotteId: string;
  /** Adresse wallet du porteur (affichée à recopier dans le wallet de la donatrice). */
  walletPorteur: string;
  faireDonT99CP: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesDonT99CP;
  messages?: MessagesValidationCagnotte;
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
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
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
    resolver: zodResolver(creerFaireDonT99CPSchema(messages)),
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

      <Alert variant="info" titre={libelles.alertEtape1Titre}>
        {libelles.alertEtape1Avant}
        <code className="ml-1 inline-block break-all rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
          {walletPorteur}
        </code>
        . {libelles.alertEtape1Apres}
      </Alert>

      <input type="hidden" {...register('cagnotte_id')} />

      <div>
        <Label htmlFor="t99-montant" obligatoire>
          {libelles.labelMontant}
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
          {libelles.labelTxHash}
        </Label>
        <Input
          id="t99-tx"
          placeholder={libelles.placeholderTxHash}
          className="font-mono text-xs"
          {...register('tx_hash')}
        />
        {errors.tx_hash !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.tx_hash.message}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="t99-prenom">{libelles.labelPrenom}</Label>
          <Input id="t99-prenom" {...register('prenom')} />
        </div>
        <div>
          <Label htmlFor="t99-nom">{libelles.labelNom}</Label>
          <Input id="t99-nom" {...register('nom')} />
        </div>
      </div>

      <div>
        <Label htmlFor="t99-email">{libelles.labelEmail}</Label>
        <Input id="t99-email" type="email" {...register('email')} />
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

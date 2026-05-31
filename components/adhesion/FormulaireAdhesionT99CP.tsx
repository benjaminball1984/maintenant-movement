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

/** Libelles surchargeables admin via CMS (V2.4.144 ; C17). */
export interface LibellesAdhesionT99CP {
  alertErreurTitre: string;
  alertSuccesTitre: string;
  alertSuccesMessage: string;
  description: string;
  etape1Titre: string;
  etape1Avant: string;
  etape1Apres: string;
  ctaOuvrirWallet: string;
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
  etape1Titre: 'Étape 1 : envoie depuis ton wallet',
  etape1Avant: "Envoie 12 99-coin depuis ton propre wallet vers l'adresse de la trésorerie :",
  etape1Apres:
    'Une fois la transaction confirmée sur Polygon, recopie ci-dessous le hash retourné par ton wallet.',
  ctaOuvrirWallet: 'Ouvrir the99coinproject.org pour payer',
  labelTxHash: 'Hash de transaction (tx_hash)',
  placeholderTxHash: '0x... (64 caractères hexadécimaux)',
  hintTxHash:
    'Le hash retourné par ton wallet après l’envoi des 12 99-coin. Format : 0x suivi de 64 caractères.',
  ctaSubmit: 'Valider mon adhésion en 12 99-coin',
  ctaEnCours: 'Enregistrement...',
};

interface FormulaireAdhesionT99CPProps {
  adhererT99CP: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Adresse du wallet de trésorerie où envoyer les 12 99-coin (donnée réelle, éditable CMS). */
  walletTresorerie: string;
  libelles?: LibellesAdhesionT99CP;
  messages?: MessagesValidationAdhesion;
}

export function FormulaireAdhesionT99CP({
  adhererT99CP,
  walletTresorerie,
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
      <Alert variant="info" titre={libelles.etape1Titre}>
        {libelles.etape1Avant}
        <code className="ml-1 inline-block break-all rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
          {walletTresorerie}
        </code>
        . {libelles.etape1Apres}
      </Alert>

      {/* Doctrine §19 : toujours la HOME du site officiel, jamais une URL profonde,
          en nouvelle fenêtre. La plateforme n'intègre aucun wallet. */}
      <a
        href="https://the99coinproject.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit text-sm font-bold text-brand hover:underline"
      >
        {libelles.ctaOuvrirWallet}
        <span className="sr-only"> (nouvelle fenêtre)</span>
      </a>

      <div>
        <Label htmlFor="adhesion-txhash" obligatoire>
          {libelles.labelTxHash}
        </Label>
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

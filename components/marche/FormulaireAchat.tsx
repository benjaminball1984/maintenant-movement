'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Label } from '@/components/ui';
import { formaterEuros, formaterT99CP } from '@/lib/marche/config';
import { portFactureCentimes } from '@/lib/marche/port';
import {
  MESSAGES_VALIDATION_MARCHE_DEFAUT,
  type MessagesValidationMarche,
} from '@/lib/messages-validation';
import { calculerFraisEuros } from '@/lib/payments/frais';
import { type DonneesAcheterProduit, creerAcheterProduitSchema } from '@/lib/validations/marche';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.150). */
export interface LibellesAchat {
  alertErreurTitre: string;
  legendeMonnaie: string;
  optionEurAide: string;
  optionT99CPAide: string;
  labelTxHash: string;
  placeholderTxHash: string;
  hintTxHash: string;
  walletInstruction: string;
  /** Encadré affiché quand l'adresse wallet de la vendeureuse est connue (P6). */
  walletVendeurTitre: string;
  walletVendeurAvant: string;
  walletVendeurApres: string;
  ctaOuvrirWallet: string;
  legendeRemise: string;
  remiseMainPropreLabel: string;
  remiseMainPropreAide: string;
  remiseEnvoiLabel: string;
  /** Gabarit avec {port} (frais de port formaté). */
  remiseEnvoiAide: string;
  /** Gabarit avec {frais} : frais de transaction Stripe (3 % + 0,30 €). */
  recapFraisEur: string;
  /** Gabarit avec {total} : total à payer (prix + frais + port éventuel). */
  recapTotalEur: string;
  /** Gabarit avec {port}. */
  portT99CPNote: string;
  alertePolTitre: string;
  alertePolMessage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesAchat = {
  alertErreurTitre: 'Achat impossible',
  legendeMonnaie: 'Choisis la monnaie de paiement',
  optionEurAide: 'Stripe Checkout. Frais 3 % + 0,30 € (à ta charge).',
  optionT99CPAide: 'Wallet T99CP. Frais 0 % (hors gaz Polygon).',
  labelTxHash: 'Hash de transaction T99CP',
  placeholderTxHash: '0x... (64 caractères hexadécimaux)',
  hintTxHash:
    'Le hash retourné par ton wallet après le paiement. Format : 0x suivi de 64 caractères.',
  walletInstruction:
    'Paie la vendeureuse en 99-coin depuis ton propre wallet (l’adresse t’est communiquée par la vendeureuse via la messagerie), puis recopie ci-dessous le hash de transaction.',
  walletVendeurTitre: 'Paie à l’adresse de la vendeureuse',
  walletVendeurAvant:
    'Envoie le montant en 99-coin depuis ton propre wallet vers l’adresse de la vendeureuse :',
  walletVendeurApres:
    'Une fois la transaction confirmée, recopie ci-dessous le hash retourné par ton wallet.',
  ctaOuvrirWallet: 'Ouvrir the99coinproject.org pour payer',
  legendeRemise: 'Comment veux-tu récupérer le produit ?',
  remiseMainPropreLabel: 'Remise en main propre',
  remiseMainPropreAide: 'Rencontre physique, sans frais de port.',
  remiseEnvoiLabel: 'Envoi postal',
  remiseEnvoiAide: 'Frais de port : {port}, en sus du prix.',
  recapFraisEur: 'Frais de transaction Maintenant! : +{frais} (3 % + 0,30 €).',
  recapTotalEur: 'Total à payer : {total}.',
  portT99CPNote:
    'Frais de port : {port}, à régler en POL (la monnaie native de Polygon) au taux du moment, en plus du prix en 99-coin.',
  alertePolTitre: 'Prévois du POL',
  alertePolMessage:
    'Les frais de port se paient en POL (la monnaie native du réseau Polygon), au taux du moment, en plus du gaz de transaction. Garde un peu de POL dans ton wallet pour couvrir l’envoi.',
  ctaSubmit: 'Confirmer l’achat',
  ctaEnCours: 'Traitement...',
};

interface FormulaireAchatProps {
  produitId: string;
  prixEurosCentimes: number;
  prixT99CPUnites: string;
  /** Frais de port en euros (centimes), 0 si pas d'envoi. Défaut 0 (D5). */
  fraisPortCentimes?: number;
  /** La vendeureuse propose-t-elle la remise en main propre ? Défaut true. */
  remiseMainPropre?: boolean;
  /** La vendeureuse propose-t-elle l'envoi postal ? Défaut false. */
  envoiPostal?: boolean;
  /**
   * Adresse wallet 99-coin de la vendeureuse si renseignée sur son profil
   * (V2.6 polish P6). Connue : on l'affiche en clair à recopier ; null (offre
   * sans wallet, ou distant avant Phase M) : on garde le message de repli
   * « l'adresse t'est communiquée via la messagerie ».
   */
  walletVendeur?: string | null;
  acheterProduit: (
    donnees: unknown,
  ) => Promise<{ ok: true; urlRedirection?: string } | { ok: false; message: string }>;
  libelles?: LibellesAchat;
  messages?: MessagesValidationMarche;
}

/**
 * Formulaire d'achat d'un produit. Double choix EUR/T99CP, cohérent
 * avec la spec §6F « la personne acheteuse choisit ».
 *
 * Pour T99CP, le wallet du front signe la transaction et fournit un
 * tx_hash ; en v1 ici, on simule par un tx_hash mock côté client
 * tant que le wallet réel n'est pas branché (chantier T99CP dédié).
 */
export function FormulaireAchat({
  produitId,
  prixEurosCentimes,
  prixT99CPUnites,
  fraisPortCentimes = 0,
  remiseMainPropre = true,
  envoiPostal = false,
  walletVendeur = null,
  acheterProduit,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_MARCHE_DEFAUT,
}: FormulaireAchatProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const aPrixEur = prixEurosCentimes > 0;
  let aPrixT99CP = false;
  try {
    aPrixT99CP = BigInt(prixT99CPUnites) > 0n;
  } catch {
    aPrixT99CP = false;
  }

  // D5 : remise main propre / envoi. Le port (en euros) ne s'applique qu'à
  // l'envoi. Quand les deux modes sont offerts ET que l'envoi a un coût, on
  // laisse le choix ; sinon le mode est fixé sans rien demander.
  const offreEnvoi = envoiPostal === true && fraisPortCentimes > 0;
  const offreMain = remiseMainPropre === true;
  const choixRemisePossible = offreEnvoi && offreMain;
  const remiseDefaut: 'main_propre' | 'envoi' = offreMain ? 'main_propre' : 'envoi';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesAcheterProduit>({
    resolver: zodResolver(creerAcheterProduitSchema(messages)),
    defaultValues: {
      produit_id: produitId,
      monnaie: aPrixEur ? 'EUR' : 'T99CP',
      mode_remise: remiseDefaut,
      tx_hash: '',
      token_turnstile: '',
    },
  });

  const monnaie = watch('monnaie');
  const modeRemise = watch('mode_remise') ?? remiseDefaut;
  // Port effectivement facturé (helper pur partagé avec l'action serveur).
  const portApplique = portFactureCentimes({ modeRemise, envoiPostal, fraisPortCentimes });
  // Frais 3 % + 0,30 € sur le prix du produit seul (jamais sur le port, cf. CDC).
  // Ajoutés au total payé par l'acheteur·euse ; la vendeureuse reçoit prix + port.
  const fraisEurCentimes = calculerFraisEuros(prixEurosCentimes);
  const totalEurCentimes = prixEurosCentimes + portApplique + fraisEurCentimes;

  async function onSubmit(donnees: DonneesAcheterProduit) {
    setErreur(null);
    setEnvoiEnCours(true);
    // C17 / doctrine §19 : la plateforme ne signe aucune transaction et ne
    // génère plus de hash factice. Pour T99CP, le hash réel est obligatoire
    // (imposé par le schéma). On fixe juste le mode de remise calculé (robuste
    // même si le choix n'est pas affiché, p. ex. produit en envoi seul).
    const a_envoyer: DonneesAcheterProduit = {
      ...donnees,
      mode_remise: modeRemise,
    };
    const resultat = await acheterProduit(a_envoyer);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    if (resultat.urlRedirection !== undefined) {
      window.location.assign(resultat.urlRedirection);
      return;
    }
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...register('produit_id')} />
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeMonnaie}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {aPrixEur ? (
            <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
              <input
                type="radio"
                value="EUR"
                {...register('monnaie')}
                className="mt-0.5 accent-brand"
              />
              <div>
                <p className="font-bold text-text-1">{formaterEuros(prixEurosCentimes)}</p>
                <p className="text-xs text-text-3">{libelles.optionEurAide}</p>
              </div>
            </label>
          ) : null}
          {aPrixT99CP ? (
            <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
              <input
                type="radio"
                value="T99CP"
                {...register('monnaie')}
                className="mt-0.5 accent-brand"
              />
              <div>
                <p className="font-bold text-text-1">{formaterT99CP(prixT99CPUnites)}</p>
                <p className="text-xs text-text-3">{libelles.optionT99CPAide}</p>
              </div>
            </label>
          ) : null}
        </div>
        {errors.monnaie !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.monnaie.message}</p>
        ) : null}
      </fieldset>

      {/* D5 : choix de remise quand les deux modes ont un coût distinct. */}
      {choixRemisePossible ? (
        <fieldset>
          <legend className="mb-2 font-body text-sm font-medium text-text-2">
            {libelles.legendeRemise}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
              <input
                type="radio"
                value="main_propre"
                {...register('mode_remise')}
                className="mt-0.5 accent-brand"
              />
              <div>
                <p className="font-bold text-text-1">{libelles.remiseMainPropreLabel}</p>
                <p className="text-xs text-text-3">{libelles.remiseMainPropreAide}</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
              <input
                type="radio"
                value="envoi"
                {...register('mode_remise')}
                className="mt-0.5 accent-brand"
              />
              <div>
                <p className="font-bold text-text-1">{libelles.remiseEnvoiLabel}</p>
                <p className="text-xs text-text-3">
                  {libelles.remiseEnvoiAide.replace('{port}', formaterEuros(fraisPortCentimes))}
                </p>
              </div>
            </label>
          </div>
        </fieldset>
      ) : offreEnvoi ? (
        // Envoi seul proposé : pas de choix, on rappelle juste le port.
        <p className="text-sm text-text-2">
          {libelles.remiseEnvoiAide.replace('{port}', formaterEuros(fraisPortCentimes))}
        </p>
      ) : null}

      {/* Récapitulatif du coût en euros : frais Maintenant! + total à payer
          (prix + frais + port éventuel). La vendeureuse reçoit prix + port. */}
      {monnaie === 'EUR' && aPrixEur ? (
        <div className="grid gap-0.5 rounded-sm bg-surface-2 p-3 text-sm text-text-2">
          <p>{libelles.recapFraisEur.replace('{frais}', formaterEuros(fraisEurCentimes))}</p>
          <p className="font-medium text-text-1">
            {libelles.recapTotalEur.replace('{total}', formaterEuros(totalEurCentimes))}
          </p>
        </div>
      ) : null}

      {portApplique > 0 && monnaie === 'T99CP' ? (
        <>
          <p className="text-sm text-text-2">
            {libelles.portT99CPNote.replace('{port}', formaterEuros(portApplique))}
          </p>
          <Alert variant="info" titre={libelles.alertePolTitre}>
            {libelles.alertePolMessage}
          </Alert>
        </>
      ) : null}

      {monnaie === 'T99CP' ? (
        <div className="grid gap-2">
          {walletVendeur !== null && walletVendeur.trim() !== '' ? (
            <Alert variant="info" titre={libelles.walletVendeurTitre}>
              {libelles.walletVendeurAvant}
              <code className="ml-1 inline-block break-all rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
                {walletVendeur}
              </code>
              . {libelles.walletVendeurApres}
            </Alert>
          ) : (
            <p className="text-sm text-text-2">{libelles.walletInstruction}</p>
          )}
          {/* Doctrine §19 : toujours la HOME du site officiel, jamais une URL
              profonde, en nouvelle fenêtre. La plateforme n'intègre aucun wallet. */}
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
            <Label htmlFor="achat-txhash" obligatoire>
              {libelles.labelTxHash}
            </Label>
            <input
              id="achat-txhash"
              type="text"
              placeholder={libelles.placeholderTxHash}
              aria-invalid={errors.tx_hash !== undefined ? true : undefined}
              className="w-full rounded-sm border border-border bg-surface p-2 font-mono text-xs"
              {...register('tx_hash')}
            />
            <p className="mt-1 text-xs text-text-3">{libelles.hintTxHash}</p>
            {errors.tx_hash !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.tx_hash.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Label } from '@/components/ui';
import { formaterEuros, formaterT99CP } from '@/lib/marche/config';
import { portFactureCentimes } from '@/lib/marche/port';
import {
  MESSAGES_VALIDATION_MARCHE_DEFAUT,
  type MessagesValidationMarche,
} from '@/lib/messages-validation';
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
  legendeRemise: string;
  remiseMainPropreLabel: string;
  remiseMainPropreAide: string;
  remiseEnvoiLabel: string;
  /** Gabarit avec {port} (frais de port formaté). */
  remiseEnvoiAide: string;
  /** Gabarit avec {total} et {port}. */
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
  optionEurAide: 'Stripe Checkout. Frais plateforme 5 %.',
  optionT99CPAide: 'Wallet T99CP. Frais 0 %.',
  labelTxHash: 'Hash de transaction T99CP (optionnel en mock)',
  placeholderTxHash: '0x... (64 hex)',
  hintTxHash: 'En mock, laisser vide : un hash factice sera généré. En prod, le wallet le fournit.',
  legendeRemise: 'Comment veux-tu récupérer le produit ?',
  remiseMainPropreLabel: 'Remise en main propre',
  remiseMainPropreAide: 'Rencontre physique, sans frais de port.',
  remiseEnvoiLabel: 'Envoi postal',
  remiseEnvoiAide: 'Frais de port : {port}, en sus du prix.',
  recapTotalEur: 'Total à payer : {total} (dont {port} de frais de port).',
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
  const totalEurCentimes = prixEurosCentimes + portApplique;

  async function onSubmit(donnees: DonneesAcheterProduit) {
    setErreur(null);
    setEnvoiEnCours(true);
    // En l'absence d'un wallet T99CP réel côté front (chantier T99CP),
    // on génère un tx_hash mock pour rester compatible avec le schéma.
    // On fixe explicitement le mode de remise calculé (robuste même si le
    // champ n'est pas affiché en radio, p. ex. produit en envoi seul).
    const a_envoyer: DonneesAcheterProduit = {
      ...donnees,
      mode_remise: modeRemise,
      ...(donnees.monnaie === 'T99CP' && (donnees.tx_hash === '' || donnees.tx_hash === undefined)
        ? { tx_hash: `0x${'a'.repeat(64)}` }
        : {}),
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

      {/* Récapitulatif du coût quand l'envoi facture un port. */}
      {portApplique > 0 && monnaie === 'EUR' ? (
        <p className="rounded-sm bg-surface-2 p-3 text-sm font-medium text-text-1">
          {libelles.recapTotalEur
            .replace('{total}', formaterEuros(totalEurCentimes))
            .replace('{port}', formaterEuros(portApplique))}
        </p>
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
        <div>
          <Label htmlFor="achat-txhash">{libelles.labelTxHash}</Label>
          <input
            id="achat-txhash"
            type="text"
            placeholder={libelles.placeholderTxHash}
            className="w-full rounded-sm border border-border bg-surface p-2 font-mono text-xs"
            {...register('tx_hash')}
          />
          <p className="mt-1 text-xs text-text-3">{libelles.hintTxHash}</p>
        </div>
      ) : null}

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

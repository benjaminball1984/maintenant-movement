'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
  type MessagesValidationCagnotte,
} from '@/lib/messages-validation';
import { type DonneesCreerCagnotte, creerCagnotteFactory } from '@/lib/validations/cagnotte';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.145). */
export interface LibellesCreationCagnotte {
  alertErreurTitre: string;
  labelTitre: string;
  placeholderTitre: string;
  legendeType: string;
  typeOuverteTitre: string;
  typeOuverteAide: string;
  typeLutteTitre: string;
  typeLutteAide: string;
  typeCotisationTitre: string;
  typeCotisationAide: string;
  labelTexte: string;
  placeholderTexte: string;
  labelObjectif: string;
  hintObjectif: string;
  labelImage: string;
  labelWallet: string;
  placeholderWallet: string;
  hintWallet: string;
  alertKycTitre: string;
  alertKycMessage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationCagnotte = {
  alertErreurTitre: 'Création impossible',
  labelTitre: 'Titre',
  placeholderTitre: 'Exemple : Caisse de grève des cheminots',
  legendeType: 'Type de cagnotte',
  typeOuverteTitre: 'Cagnotte ouverte',
  typeOuverteAide: 'Projet, personne, cause. Don libre.',
  typeLutteTitre: 'Caisse de lutte et de grève',
  typeLutteAide: 'Soutien matériel à une mobilisation en cours.',
  typeCotisationTitre: 'Cotisation',
  typeCotisationAide:
    "Sécurité sociale du logement / mobilités / alimentation, RBU. Réservé à l'équipe nationale.",
  labelTexte: 'Présentation',
  placeholderTexte: 'Décris le projet, la cause, le besoin. 100 à 5000 caractères.',
  labelObjectif: 'Objectif chiffré (en euros)',
  hintObjectif: "0 = pas d'objectif chiffré. Les T99CP comptent 1:1 dans la jauge.",
  labelImage: 'Image illustrative (optionnelle)',
  labelWallet: 'Adresse wallet T99CP (optionnel)',
  placeholderWallet: '0x...',
  hintWallet: 'Si renseignée, les dons en 99-coin seront possibles (frais 0 %).',
  alertKycTitre: 'Stripe Connect (KYC)',
  alertKycMessage:
    'Pour recevoir les dons en euros, tu devras compléter le KYC Stripe Connect. Cette étape sera proposée juste après la création (en mode local, elle est simulée).',
  ctaSubmit: 'Créer la cagnotte',
  ctaEnCours: 'Création...',
};

interface FormulaireCreationCagnotteProps {
  creerCagnotte: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  /** True si la personne connectée peut créer une cotisation (admin national). */
  peutCreerCotisation: boolean;
  libelles?: LibellesCreationCagnotte;
  messages?: MessagesValidationCagnotte;
}

export function FormulaireCreationCagnotte({
  creerCagnotte,
  peutCreerCotisation,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
}: FormulaireCreationCagnotteProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerCagnotte>({
    resolver: zodResolver(creerCagnotteFactory(messages)),
    defaultValues: {
      titre: '',
      texte: '',
      type: 'ouverte',
      image_url: '',
      objectif_euros: 1000,
      wallet_t99cp: '',
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerCagnotte) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerCagnotte(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/mobiliser/cagnottes/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="cag-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="cag-titre" placeholder={libelles.placeholderTitre} {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeType}
        </legend>
        <div className="grid gap-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border bg-surface p-3 hover:bg-surface-2">
            <input
              type="radio"
              value="ouverte"
              {...register('type')}
              className="mt-1 accent-brand"
            />
            <div className="text-sm">
              <p className="font-bold text-text-1">{libelles.typeOuverteTitre}</p>
              <p className="text-text-3">{libelles.typeOuverteAide}</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border bg-surface p-3 hover:bg-surface-2">
            <input type="radio" value="lutte" {...register('type')} className="mt-1 accent-brand" />
            <div className="text-sm">
              <p className="font-bold text-text-1">{libelles.typeLutteTitre}</p>
              <p className="text-text-3">{libelles.typeLutteAide}</p>
            </div>
          </label>
          <label
            className={`flex items-start gap-3 rounded-sm border border-border bg-surface p-3 ${peutCreerCotisation ? 'cursor-pointer hover:bg-surface-2' : 'cursor-not-allowed opacity-50'}`}
          >
            <input
              type="radio"
              value="cotisation"
              {...register('type')}
              className="mt-1 accent-brand"
              disabled={!peutCreerCotisation}
            />
            <div className="text-sm">
              <p className="font-bold text-text-1">{libelles.typeCotisationTitre}</p>
              <p className="text-text-3">{libelles.typeCotisationAide}</p>
            </div>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="cag-texte" obligatoire>
          {libelles.labelTexte}
        </Label>
        <Textarea
          id="cag-texte"
          rows={8}
          placeholder={libelles.placeholderTexte}
          {...register('texte')}
        />
        {errors.texte !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.texte.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="cag-objectif" obligatoire>
          {libelles.labelObjectif}
        </Label>
        <Input
          id="cag-objectif"
          type="number"
          inputMode="numeric"
          min={0}
          max={1_000_000}
          step={100}
          className="w-full sm:max-w-[220px]"
          {...register('objectif_euros', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-text-3">{libelles.hintObjectif}</p>
        {errors.objectif_euros !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.objectif_euros.message}</p>
        ) : null}
      </div>

      <ChampImageObjet
        name="image_url"
        libelle={libelles.labelImage}
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      {errors.image_url !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.image_url.message}</p>
      ) : null}

      <div>
        <Label htmlFor="cag-wallet">{libelles.labelWallet}</Label>
        <Input
          id="cag-wallet"
          placeholder={libelles.placeholderWallet}
          className="font-mono text-xs"
          {...register('wallet_t99cp')}
        />
        <p className="mt-1 text-xs text-text-3">{libelles.hintWallet}</p>
        {errors.wallet_t99cp !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.wallet_t99cp.message}</p>
        ) : null}
      </div>

      <Alert variant="info" titre={libelles.alertKycTitre}>
        {libelles.alertKycMessage}
      </Alert>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
  type MessagesValidationCagnotte,
} from '@/lib/messages-validation';
import { type DonneesFaireDonEuros, creerFaireDonEurosSchema } from '@/lib/validations/cagnotte';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.145). */
export interface LibellesDonEuros {
  alertErreurTitre: string;
  labelMontant: string;
  decompositionPattern: string;
  decompositionFraisLabel: string;
  decompositionNetLabel: string;
  labelPrenom: string;
  labelNom: string;
  labelEmail: string;
  labelCodePostal: string;
  labelNewsletter: string;
  labelContact: string;
  ctaSubmitPrefixe: string;
  ctaEnCours: string;
  noteStripe: string;
}

const LIBELLES_DEFAUT: LibellesDonEuros = {
  alertErreurTitre: 'Don impossible',
  labelMontant: 'Montant en euros',
  decompositionPattern: 'Décomposition : {brut} payés · {frais} de frais Maintenant! (5 %) ·',
  decompositionFraisLabel: 'frais Maintenant!',
  decompositionNetLabel: 'pour la cagnotte',
  labelPrenom: 'Prénom (optionnel)',
  labelNom: 'Nom (optionnel)',
  labelEmail: 'Email (pour le reçu, optionnel)',
  labelCodePostal: 'Code postal (optionnel)',
  labelNewsletter: 'Je veux recevoir la newsletter Maintenant!.',
  labelContact: "J'autorise la personne porteuse de la cagnotte à me contacter pour des nouvelles.",
  ctaSubmitPrefixe: 'Donner',
  ctaEnCours: 'Redirection vers Stripe...',
  noteStripe:
    'Paiement sécurisé par Stripe. En mode local de développement, le paiement est simulé.',
};

interface FormulaireDonEurosProps {
  cagnotteId: string;
  faireDonEuros: (
    donnees: unknown,
  ) => Promise<{ ok: true; urlRedirection: string } | { ok: false; message: string }>;
  libelles?: LibellesDonEuros;
  messages?: MessagesValidationCagnotte;
}

const FORMAT_EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/**
 * Formulaire de don en euros (Client Component). Redirige vers Stripe
 * Checkout (URL mock ou réelle selon `PAYMENT_PROVIDER`).
 *
 * Le montant est saisi en euros (entiers de €), converti en centimes
 * pour la BDD/Server Action.
 *
 * Frais : on affiche en clair la décomposition « X € − 5% frais = Y € »
 * pour la cagnotte, conformément à la transparence demandée (spec §5D).
 */
export function FormulaireDonEuros({
  cagnotteId,
  faireDonEuros,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
}: FormulaireDonEurosProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [montantEuros, setMontantEuros] = useState<number>(20);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesFaireDonEuros>({
    resolver: zodResolver(creerFaireDonEurosSchema(messages)),
    defaultValues: {
      cagnotte_id: cagnotteId,
      montant_centimes: 2000,
      prenom: '',
      nom: '',
      email: '',
      code_postal: '',
      accepte_newsletter: false,
      accepte_contact_createurice: false,
      token_turnstile: '',
    },
  });

  function gererMontantChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valeur = Number(e.target.value);
    if (Number.isNaN(valeur) || valeur < 0) {
      setMontantEuros(0);
      setValue('montant_centimes', 0, { shouldValidate: true });
      return;
    }
    setMontantEuros(valeur);
    setValue('montant_centimes', Math.round(valeur * 100), { shouldValidate: true });
  }

  async function onSubmit(donnees: DonneesFaireDonEuros) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await faireDonEuros(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    // Redirection navigateur vers Checkout (Stripe ou mock).
    window.location.href = resultat.urlRedirection;
  }

  const frais = Math.round(montantEuros * 100 * 0.05);
  const net = montantEuros * 100 - frais;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <input type="hidden" {...register('cagnotte_id')} />

      <div>
        <Label htmlFor="don-montant" obligatoire>
          {libelles.labelMontant}
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          {[10, 20, 50, 100].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMontantEuros(m);
                setValue('montant_centimes', m * 100, { shouldValidate: true });
              }}
              className="rounded-pill border border-border bg-surface px-3 py-1 text-sm hover:bg-surface-2"
            >
              {m} €
            </button>
          ))}
          <Input
            id="don-montant"
            type="number"
            inputMode="numeric"
            min={1}
            max={1_000_000}
            step={1}
            value={montantEuros}
            onChange={gererMontantChange}
            className="w-full sm:max-w-[140px]"
          />
        </div>
        {errors.montant_centimes !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.montant_centimes.message}</p>
        ) : null}
        {montantEuros > 0 ? (
          <p className="mt-2 text-xs text-text-3">
            {libelles.decompositionPattern
              .replace('{brut}', FORMAT_EURO.format(montantEuros))
              .replace('{frais}', FORMAT_EURO.format(frais / 100))}{' '}
            <strong className="text-text-2">
              {FORMAT_EURO.format(net / 100)} {libelles.decompositionNetLabel}
            </strong>
            .
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="don-prenom">{libelles.labelPrenom}</Label>
          <Input id="don-prenom" autoComplete="given-name" {...register('prenom')} />
        </div>
        <div>
          <Label htmlFor="don-nom">{libelles.labelNom}</Label>
          <Input id="don-nom" autoComplete="family-name" {...register('nom')} />
        </div>
      </div>

      <div>
        <Label htmlFor="don-email">{libelles.labelEmail}</Label>
        <Input id="don-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="don-cp">{libelles.labelCodePostal}</Label>
        <Input
          id="don-cp"
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
          className="w-full sm:max-w-[140px]"
          {...register('code_postal')}
        />
        {errors.code_postal !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.code_postal.message}</p>
        ) : null}
      </div>

      <label
        htmlFor="don-newsletter"
        className="flex cursor-pointer items-start gap-2 text-sm text-text-2"
      >
        <input
          id="don-newsletter"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded-xs accent-brand"
          {...register('accepte_newsletter')}
        />
        <span>{libelles.labelNewsletter}</span>
      </label>

      <label
        htmlFor="don-contact"
        className="flex cursor-pointer items-start gap-2 text-sm text-text-2"
      >
        <input
          id="don-contact"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded-xs accent-brand"
          {...register('accepte_contact_createurice')}
        />
        <span>{libelles.labelContact}</span>
      </label>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours || montantEuros < 1}>
        {envoiEnCours
          ? libelles.ctaEnCours
          : `${libelles.ctaSubmitPrefixe} ${FORMAT_EURO.format(montantEuros)}`}
      </Button>
      <p className="-mt-2 text-xs text-text-3">{libelles.noteStripe}</p>
    </form>
  );
}

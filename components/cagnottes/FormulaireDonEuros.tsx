'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import { type DonneesFaireDonEuros, faireDonEurosSchema } from '@/lib/validations/cagnotte';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireDonEurosProps {
  cagnotteId: string;
  faireDonEuros: (
    donnees: unknown,
  ) => Promise<{ ok: true; urlRedirection: string } | { ok: false; message: string }>;
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
export function FormulaireDonEuros({ cagnotteId, faireDonEuros }: FormulaireDonEurosProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [montantEuros, setMontantEuros] = useState<number>(20);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesFaireDonEuros>({
    resolver: zodResolver(faireDonEurosSchema),
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
        <Alert variant="danger" titre="Don impossible">
          {erreur}
        </Alert>
      ) : null}

      <input type="hidden" {...register('cagnotte_id')} />

      <div>
        <Label htmlFor="don-montant" obligatoire>
          Montant en euros
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
            className="max-w-[140px]"
          />
        </div>
        {errors.montant_centimes !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.montant_centimes.message}</p>
        ) : null}
        {montantEuros > 0 ? (
          <p className="mt-2 text-xs text-text-3">
            Décomposition : {FORMAT_EURO.format(montantEuros)} payés ·{' '}
            {FORMAT_EURO.format(frais / 100)} de frais Maintenant! (5 %) ·{' '}
            <strong className="text-text-2">
              {FORMAT_EURO.format(net / 100)} pour la cagnotte
            </strong>
            .
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="don-prenom">Prénom (optionnel)</Label>
          <Input id="don-prenom" autoComplete="given-name" {...register('prenom')} />
        </div>
        <div>
          <Label htmlFor="don-nom">Nom (optionnel)</Label>
          <Input id="don-nom" autoComplete="family-name" {...register('nom')} />
        </div>
      </div>

      <div>
        <Label htmlFor="don-email">Email (pour le reçu, optionnel)</Label>
        <Input id="don-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="don-cp">Code postal (optionnel)</Label>
        <Input
          id="don-cp"
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
          className="max-w-[140px]"
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
        <span>Je veux recevoir la newsletter Maintenant!.</span>
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
        <span>
          J'autorise la personne porteuse de la cagnotte à me contacter pour des nouvelles.
        </span>
      </label>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours || montantEuros < 1}>
        {envoiEnCours ? 'Redirection vers Stripe...' : `Donner ${FORMAT_EURO.format(montantEuros)}`}
      </Button>
      <p className="-mt-2 text-xs text-text-3">
        Paiement sécurisé par Stripe. En mode local de développement, le paiement est simulé.
      </p>
    </form>
  );
}

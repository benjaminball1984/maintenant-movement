'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Label } from '@/components/ui';
import { formaterEuros, formaterT99CP } from '@/lib/marche/config';
import { type DonneesAcheterProduit, acheterProduitSchema } from '@/lib/validations/marche';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireAchatProps {
  produitId: string;
  prixEurosCentimes: number;
  prixT99CPUnites: string;
  acheterProduit: (
    donnees: unknown,
  ) => Promise<{ ok: true; urlRedirection?: string } | { ok: false; message: string }>;
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
  acheterProduit,
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesAcheterProduit>({
    resolver: zodResolver(acheterProduitSchema),
    defaultValues: {
      produit_id: produitId,
      monnaie: aPrixEur ? 'EUR' : 'T99CP',
      tx_hash: '',
      token_turnstile: '',
    },
  });

  const monnaie = watch('monnaie');

  async function onSubmit(donnees: DonneesAcheterProduit) {
    setErreur(null);
    setEnvoiEnCours(true);
    // En l'absence d'un wallet T99CP réel côté front (chantier T99CP),
    // on génère un tx_hash mock pour rester compatible avec le schéma.
    const a_envoyer: DonneesAcheterProduit =
      donnees.monnaie === 'T99CP' && (donnees.tx_hash === '' || donnees.tx_hash === undefined)
        ? { ...donnees, tx_hash: `0x${'a'.repeat(64)}` }
        : donnees;
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
        <Alert variant="danger" titre="Achat impossible">
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          Choisis la monnaie de paiement
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
                <p className="text-xs text-text-3">Stripe Checkout. Frais plateforme 5 %.</p>
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
                <p className="text-xs text-text-3">Wallet T99CP. Frais 0 %.</p>
              </div>
            </label>
          ) : null}
        </div>
        {errors.monnaie !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.monnaie.message}</p>
        ) : null}
      </fieldset>

      {monnaie === 'T99CP' ? (
        <div>
          <Label htmlFor="achat-txhash">Hash de transaction T99CP (optionnel en mock)</Label>
          <input
            id="achat-txhash"
            type="text"
            placeholder="0x... (64 hex)"
            className="w-full rounded-sm border border-border bg-surface p-2 font-mono text-xs"
            {...register('tx_hash')}
          />
          <p className="mt-1 text-xs text-text-3">
            En mock, laisser vide : un hash factice sera généré. En prod, le wallet le fournit.
          </p>
        </div>
      ) : null}

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Traitement...' : 'Confirmer l’achat'}
      </Button>
    </form>
  );
}

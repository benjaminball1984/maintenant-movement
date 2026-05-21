'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { type DonneesCreerCagnotte, creerCagnotteSchema } from '@/lib/validations/cagnotte';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireCreationCagnotteProps {
  creerCagnotte: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  /** True si la personne connectée peut créer une cotisation (admin national). */
  peutCreerCotisation: boolean;
}

export function FormulaireCreationCagnotte({
  creerCagnotte,
  peutCreerCotisation,
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
    resolver: zodResolver(creerCagnotteSchema),
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
        <Alert variant="danger" titre="Création impossible">
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="cag-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="cag-titre"
          placeholder="Exemple : Caisse de grève des cheminots"
          {...register('titre')}
        />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">Type de cagnotte</legend>
        <div className="grid gap-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border bg-surface p-3 hover:bg-surface-2">
            <input
              type="radio"
              value="ouverte"
              {...register('type')}
              className="mt-1 accent-brand"
            />
            <div className="text-sm">
              <p className="font-bold text-text-1">Cagnotte ouverte</p>
              <p className="text-text-3">Projet, personne, cause. Don libre.</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border bg-surface p-3 hover:bg-surface-2">
            <input type="radio" value="lutte" {...register('type')} className="mt-1 accent-brand" />
            <div className="text-sm">
              <p className="font-bold text-text-1">Caisse de lutte et de grève</p>
              <p className="text-text-3">Soutien matériel à une mobilisation en cours.</p>
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
              <p className="font-bold text-text-1">Cotisation</p>
              <p className="text-text-3">
                Sécurité sociale du logement / mobilités / alimentation, RBU. Réservé à l'équipe
                nationale.
              </p>
            </div>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="cag-texte" obligatoire>
          Présentation
        </Label>
        <Textarea
          id="cag-texte"
          rows={8}
          placeholder="Décris le projet, la cause, le besoin. 100 à 5000 caractères."
          {...register('texte')}
        />
        {errors.texte !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.texte.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="cag-objectif" obligatoire>
          Objectif chiffré (en euros)
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
        <p className="mt-1 text-xs text-text-3">
          0 = pas d'objectif chiffré. Les T99CP comptent 1:1 dans la jauge.
        </p>
        {errors.objectif_euros !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.objectif_euros.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="cag-image">Image (URL, optionnel)</Label>
        <Input id="cag-image" type="url" placeholder="https://..." {...register('image_url')} />
        {errors.image_url !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.image_url.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="cag-wallet">Adresse wallet T99CP (optionnel)</Label>
        <Input
          id="cag-wallet"
          placeholder="0x..."
          className="font-mono text-xs"
          {...register('wallet_t99cp')}
        />
        <p className="mt-1 text-xs text-text-3">
          Si renseignée, les dons en 99-coin seront possibles (frais 0 %).
        </p>
        {errors.wallet_t99cp !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.wallet_t99cp.message}</p>
        ) : null}
      </div>

      <Alert variant="info" titre="Stripe Connect (KYC)">
        Pour recevoir les dons en euros, tu devras compléter le KYC Stripe Connect. Cette étape sera
        proposée juste après la création (en mode local, elle est simulée).
      </Alert>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Création...' : 'Créer la cagnotte'}
      </Button>
    </form>
  );
}

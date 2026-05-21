'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { type DonneesCreerServiceSel, creerServiceSelSchema } from '@/lib/validations/sel';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireCreationServiceProps {
  creerServiceSel: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
}

export function FormulaireCreationService({ creerServiceSel }: FormulaireCreationServiceProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerServiceSel>({
    resolver: zodResolver(creerServiceSelSchema),
    defaultValues: {
      titre: '',
      description: '',
      categorie: 'service',
      sens: 'propose',
      duree_minutes_estimee: 60,
      lieu: '',
      latitude: null,
      longitude: null,
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerServiceSel) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerServiceSel(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/s-entraider/sel/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre="Publication impossible">
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">Catégorie</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="service"
              {...register('categorie')}
              className="mt-0.5 accent-brand"
            />
            <div>
              <p className="font-bold text-text-1">Service</p>
              <p className="text-xs text-text-3">Entre particulier·ères.</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="volontariat"
              {...register('categorie')}
              className="mt-0.5 accent-brand"
            />
            <div>
              <p className="font-bold text-text-1">Volontariat</p>
              <p className="text-xs text-text-3">Pour un collectif (association, commune, etc.).</p>
            </div>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">Sens</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="propose"
              {...register('sens')}
              className="mt-0.5 accent-brand"
            />
            <span>J'offre mon temps</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="cherche"
              {...register('sens')}
              className="mt-0.5 accent-brand"
            />
            <span>J'ai besoin d'aide</span>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="sel-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="sel-titre"
          placeholder="Exemple : Coup de main jardinage le samedi"
          {...register('titre')}
        />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="sel-description" obligatoire>
          Description
        </Label>
        <Textarea id="sel-description" rows={6} {...register('description')} />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="sel-duree" obligatoire>
          Durée estimée (en minutes)
        </Label>
        <Input
          id="sel-duree"
          type="number"
          inputMode="numeric"
          min={15}
          max={480}
          step={15}
          className="w-full sm:max-w-[180px]"
          {...register('duree_minutes_estimee', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-text-3">
          1 minute = 1 99-coin crédité après réalisation (modération 2 h).
        </p>
        {errors.duree_minutes_estimee !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.duree_minutes_estimee.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="sel-lieu" obligatoire>
          Lieu
        </Label>
        <Input id="sel-lieu" placeholder="Ville ou quartier" {...register('lieu')} />
        {errors.lieu !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.lieu.message}</p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Publication...' : 'Publier le service'}
      </Button>
    </form>
  );
}

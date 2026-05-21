'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { type DonneesCreerBoutique, creerBoutiqueSchema } from '@/lib/validations/marche';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireCreationBoutiqueProps {
  creerBoutique: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
}

export function FormulaireCreationBoutique({ creerBoutique }: FormulaireCreationBoutiqueProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerBoutique>({
    resolver: zodResolver(creerBoutiqueSchema),
    defaultValues: {
      nom: '',
      description: '',
      sens: 'propose',
      image_url: '',
      ouverte_du: '',
      ouverte_au: '',
      lieu: '',
      latitude: null,
      longitude: null,
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerBoutique) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerBoutique(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/s-entraider/marche/boutiques/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre="Publication impossible">
          {erreur}
        </Alert>
      ) : null}

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
            <span>Je crée ma boutique</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="cherche"
              {...register('sens')}
              className="mt-0.5 accent-brand"
            />
            <span>Je cherche à rejoindre ou co-créer</span>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="boutique-nom" obligatoire>
          Nom de la boutique
        </Label>
        <Input
          id="boutique-nom"
          placeholder="Exemple : Vide-grenier de Saint-Denis"
          {...register('nom')}
        />
        {errors.nom !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="boutique-description" obligatoire>
          Description
        </Label>
        <Textarea id="boutique-description" rows={6} {...register('description')} />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="boutique-du">Ouverture (début)</Label>
          <Input id="boutique-du" type="datetime-local" {...register('ouverte_du')} />
        </div>
        <div>
          <Label htmlFor="boutique-au">Fermeture (fin)</Label>
          <Input id="boutique-au" type="datetime-local" {...register('ouverte_au')} />
        </div>
      </div>
      <p className="text-xs text-text-3">
        Laisser vide pour une boutique permanente. Sinon, indiquer la plage du vide-grenier ou de la
        brocante.
      </p>
      {errors.ouverte_du !== undefined ? (
        <p className="text-xs text-danger">{errors.ouverte_du.message}</p>
      ) : null}

      <div>
        <Label htmlFor="boutique-lieu">Lieu (optionnel)</Label>
        <Input id="boutique-lieu" placeholder="Ville ou adresse" {...register('lieu')} />
      </div>

      <div>
        <Label htmlFor="boutique-image">URL d'image (optionnel)</Label>
        <Input
          id="boutique-image"
          type="url"
          placeholder="https://..."
          {...register('image_url')}
        />
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Publication...' : 'Publier la boutique'}
      </Button>
    </form>
  );
}

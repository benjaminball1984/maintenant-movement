'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_MOMENTS_DEFAUT,
  type MessagesValidationMoments,
} from '@/lib/messages-validation';
import { LISTE_TYPES_MOMENTS } from '@/lib/moments/config';
import {
  type DonneesCreerMomentSolidaire,
  creerMomentSolidaireFactory,
} from '@/lib/validations/moments';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireProps {
  creerMomentSolidaire: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  messages?: MessagesValidationMoments;
}

export function FormulaireCreationMoment({
  creerMomentSolidaire,
  messages = MESSAGES_VALIDATION_MOMENTS_DEFAUT,
}: FormulaireProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesCreerMomentSolidaire>({
    resolver: zodResolver(creerMomentSolidaireFactory(messages)),
    defaultValues: {
      titre: '',
      description: '',
      type: 'rencontre',
      lieu: '',
      latitude: null,
      longitude: null,
      commence_le: '',
      termine_le: '',
      commune_id: '',
      cause_locale: '',
      capacite_max: null,
      token_turnstile: '',
    },
  });

  const type = watch('type');

  async function onSubmit(donnees: DonneesCreerMomentSolidaire) {
    setErreur(null);
    setEnvoiEnCours(true);
    const a_envoyer: DonneesCreerMomentSolidaire = {
      ...donnees,
      commence_le: new Date(donnees.commence_le).toISOString(),
      termine_le:
        donnees.termine_le === '' || donnees.termine_le === undefined
          ? ''
          : new Date(donnees.termine_le).toISOString(),
    };
    const resultat = await creerMomentSolidaire(a_envoyer);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/agir/moments-solidaires/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre="Création impossible">
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">Type</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LISTE_TYPES_MOMENTS.map((t) => (
            <label
              key={t.type}
              className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
            >
              <input
                type="radio"
                value={t.type}
                {...register('type')}
                className="mt-0.5 accent-brand"
              />
              <div>
                <p className="font-bold text-text-1">{t.libelle}</p>
                <p className="text-xs text-text-3">{t.description}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {type === 'porte_a_porte' ? (
        <Alert variant="info" titre="7 RDV générés automatiquement">
          Tu crées le porte-à-porte parent ; les 7 moments enfants seront créés automatiquement avec
          leurs dates (1er passage, 2e passage, tri, distribution, maraude, repas, volontaires).
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="moment-titre" obligatoire>
          Titre
        </Label>
        <Input id="moment-titre" {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="moment-description" obligatoire>
          Description
        </Label>
        <Textarea id="moment-description" rows={5} {...register('description')} />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="moment-lieu" obligatoire>
          Lieu
        </Label>
        <Input id="moment-lieu" {...register('lieu')} />
        {errors.lieu !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.lieu.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="moment-debut" obligatoire>
            Date et heure de début
          </Label>
          <Input id="moment-debut" type="datetime-local" {...register('commence_le')} />
          {errors.commence_le !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.commence_le.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="moment-fin">Date de fin (optionnel)</Label>
          <Input id="moment-fin" type="datetime-local" {...register('termine_le')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="moment-cause">Cause locale (optionnel)</Label>
          <Input
            id="moment-cause"
            placeholder="Asso de quartier, classe verte, etc."
            {...register('cause_locale')}
          />
        </div>
        <div>
          <Label htmlFor="moment-capa">Capacité maximale (optionnel)</Label>
          <Input
            id="moment-capa"
            type="number"
            min={1}
            max={10000}
            {...register('capacite_max', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
          />
        </div>
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Publication...' : 'Publier le moment'}
      </Button>
    </form>
  );
}

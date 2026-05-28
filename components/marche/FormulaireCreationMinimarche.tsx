'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import { MONNAIES, MONNAIES_PHYSIQUES } from '@/lib/marche/config';
import {
  MESSAGES_VALIDATION_MARCHE_DEFAUT,
  type MessagesValidationMarche,
} from '@/lib/messages-validation';
import { type DonneesCreerMinimarche, creerMinimarcheFactory } from '@/lib/validations/marche';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.152). */
export interface LibellesCreationMinimarche {
  alertErreurTitre: string;
  labelTitre: string;
  placeholderTitre: string;
  labelDescription: string;
  labelLieu: string;
  placeholderLieu: string;
  labelDebut: string;
  labelFin: string;
  legendeMonnaies: string;
  hintMonnaies: string;
  libelleImage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationMinimarche = {
  alertErreurTitre: 'Publication impossible',
  labelTitre: 'Titre du minimarché',
  placeholderTitre: 'Exemple : Minimarché solidaire Belleville',
  labelDescription: 'Description (conseils pratiques, organisation)',
  labelLieu: 'Lieu (adresse précise pour la carte)',
  placeholderLieu: 'Place du marché, 75020 Paris',
  labelDebut: 'Date et heure de début',
  labelFin: 'Date et heure de fin',
  legendeMonnaies: 'Monnaies acceptées',
  hintMonnaies:
    'Au moins une monnaie. T99CP et Euros sont acceptés en physique comme en ligne. Ğ1 et monnaies locales restent réservées au physique.',
  libelleImage: 'Image illustrative (optionnelle)',
  ctaSubmit: 'Annoncer le minimarché',
  ctaEnCours: 'Publication...',
};

interface FormulaireCreationMinimarcheProps {
  creerMinimarche: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationMinimarche;
  messages?: MessagesValidationMarche;
}

export function FormulaireCreationMinimarche({
  creerMinimarche,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_MARCHE_DEFAUT,
}: FormulaireCreationMinimarcheProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesCreerMinimarche>({
    resolver: zodResolver(creerMinimarcheFactory(messages)),
    defaultValues: {
      titre: '',
      description: '',
      image_url: '',
      lieu: '',
      latitude: null,
      longitude: null,
      commence_le: '',
      termine_le: '',
      monnaies_acceptees: ['T99CP', 'EUR'],
      token_turnstile: '',
    },
  });

  const monnaies = watch('monnaies_acceptees');

  function toggleMonnaie(code: (typeof MONNAIES_PHYSIQUES)[number]) {
    const ensemble = new Set(monnaies);
    if (ensemble.has(code)) {
      ensemble.delete(code);
    } else {
      ensemble.add(code);
    }
    // On préserve l'ordre du catalogue pour un rendu stable.
    setValue(
      'monnaies_acceptees',
      MONNAIES_PHYSIQUES.filter((c) => ensemble.has(c)),
      { shouldValidate: true },
    );
  }

  async function onSubmit(donnees: DonneesCreerMinimarche) {
    setErreur(null);
    setEnvoiEnCours(true);
    // Les datetime-local renvoient un format sans timezone : on les
    // convertit en ISO 8601 avant envoi pour passer le `z.string().datetime()`.
    const a_envoyer: DonneesCreerMinimarche = {
      ...donnees,
      commence_le: new Date(donnees.commence_le).toISOString(),
      termine_le: new Date(donnees.termine_le).toISOString(),
    };
    const resultat = await creerMinimarche(a_envoyer);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/s-entraider/marche/minimarches/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="minimarche-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input
          id="minimarche-titre"
          placeholder={libelles.placeholderTitre}
          {...register('titre')}
        />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="minimarche-description" obligatoire>
          {libelles.labelDescription}
        </Label>
        <Textarea id="minimarche-description" rows={6} {...register('description')} />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="minimarche-lieu" obligatoire>
          {libelles.labelLieu}
        </Label>
        <Input id="minimarche-lieu" placeholder={libelles.placeholderLieu} {...register('lieu')} />
        {errors.lieu !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.lieu.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="minimarche-debut" obligatoire>
            {libelles.labelDebut}
          </Label>
          <Input id="minimarche-debut" type="datetime-local" {...register('commence_le')} />
          {errors.commence_le !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.commence_le.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="minimarche-fin" obligatoire>
            {libelles.labelFin}
          </Label>
          <Input id="minimarche-fin" type="datetime-local" {...register('termine_le')} />
          {errors.termine_le !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.termine_le.message}</p>
          ) : null}
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeMonnaies}
        </legend>
        <p className="mb-2 text-xs text-text-3">{libelles.hintMonnaies}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MONNAIES_PHYSIQUES.map((code) => {
            const config = MONNAIES[code];
            const checked = monnaies.includes(code);
            return (
              <label
                key={code}
                className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMonnaie(code)}
                  className="mt-0.5 accent-brand"
                />
                <div>
                  <p className="font-bold text-text-1">{config.libelle}</p>
                  <p className="text-xs text-text-3">{config.aide}</p>
                </div>
              </label>
            );
          })}
        </div>
        {errors.monnaies_acceptees !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.monnaies_acceptees.message}</p>
        ) : null}
      </fieldset>

      <ChampImageObjet
        name="image_url"
        libelle={libelles.libelleImage}
        onChange={(url) => setValue('image_url', url ?? '')}
      />

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

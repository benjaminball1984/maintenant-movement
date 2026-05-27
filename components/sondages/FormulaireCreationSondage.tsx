'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_SONDAGES_DEFAUT,
  type MessagesValidationSondages,
} from '@/lib/messages-validation';
import { type DonneesCreerSondage, creerSondageFactory } from '@/lib/validations/sondages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.151). */
export interface LibellesCreationSondage {
  alertErreurTitre: string;
  erreurOptionsHorsLimites: string;
  labelTitre: string;
  labelQuestion: string;
  labelOptions: string;
  placeholderOptions: string;
  legendeMode: string;
  modeClassiqueTitre: string;
  modeClassiqueAide: string;
  modePondereTitre: string;
  modePondereAide: string;
  labelImage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationSondage = {
  alertErreurTitre: 'Création impossible',
  erreurOptionsHorsLimites: 'Indique entre 2 et 10 options, une par ligne.',
  labelTitre: 'Titre',
  labelQuestion: 'Question',
  labelOptions: 'Options (une par ligne, 2 à 10)',
  placeholderOptions: 'Option 1\nOption 2\nOption 3',
  legendeMode: 'Mode',
  modeClassiqueTitre: 'Classique',
  modeClassiqueAide: 'Vote brut.',
  modePondereTitre: 'Pondéré',
  modePondereAide: 'Méthode des quotas appliquée dès 300 répondant·es.',
  labelImage: 'Image illustrative (optionnelle)',
  ctaSubmit: 'Publier le sondage',
  ctaEnCours: 'Publication...',
};

interface FormulaireCreationSondageProps {
  creerSondage: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationSondage;
  messages?: MessagesValidationSondages;
}

export function FormulaireCreationSondage({
  creerSondage,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_SONDAGES_DEFAUT,
}: FormulaireCreationSondageProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [optionsTexte, setOptionsTexte] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerSondage>({
    resolver: zodResolver(creerSondageFactory(messages)),
    defaultValues: {
      titre: '',
      question: '',
      options: [],
      image_url: '',
      mode: 'classique',
      commune_id: '',
      latitude: null,
      longitude: null,
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerSondage) {
    setErreur(null);
    setEnvoiEnCours(true);
    // Parse les options depuis la textarea (une ligne par option).
    const options = optionsTexte
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');
    if (options.length < 2 || options.length > 10) {
      setErreur(libelles.erreurOptionsHorsLimites);
      setEnvoiEnCours(false);
      return;
    }
    const resultat = await creerSondage({ ...donnees, options });
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/s-informer/sondages/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="sondage-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="sondage-titre" {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="sondage-question" obligatoire>
          {libelles.labelQuestion}
        </Label>
        <Textarea id="sondage-question" rows={3} {...register('question')} />
        {errors.question !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.question.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="sondage-options" obligatoire>
          {libelles.labelOptions}
        </Label>
        <Textarea
          id="sondage-options"
          rows={6}
          value={optionsTexte}
          onChange={(e) => setOptionsTexte(e.target.value)}
          placeholder={libelles.placeholderOptions}
        />
      </div>
      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeMode}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="classique"
              {...register('mode')}
              className="mt-0.5 accent-brand"
            />
            <div>
              <p className="font-bold text-text-1">{libelles.modeClassiqueTitre}</p>
              <p className="text-xs text-text-3">{libelles.modeClassiqueAide}</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="pondere"
              {...register('mode')}
              className="mt-0.5 accent-brand"
            />
            <div>
              <p className="font-bold text-text-1">{libelles.modePondereTitre}</p>
              <p className="text-xs text-text-3">{libelles.modePondereAide}</p>
            </div>
          </label>
        </div>
      </fieldset>
      <ChampImageObjet
        name="image_url"
        libelle={libelles.labelImage}
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_SEL_DEFAUT,
  type MessagesValidationSel,
} from '@/lib/messages-validation';
import { type DonneesCreerServiceSel, creerServiceSelFactory } from '@/lib/validations/sel';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.150). */
export interface LibellesCreationService {
  alertErreurTitre: string;
  legendeCategorie: string;
  categorieServiceTitre: string;
  categorieServiceAide: string;
  categorieVolontariatTitre: string;
  categorieVolontariatAide: string;
  legendeSens: string;
  sensPropose: string;
  sensCherche: string;
  labelTitre: string;
  placeholderTitre: string;
  labelDescription: string;
  labelDuree: string;
  hintDuree: string;
  labelLieu: string;
  placeholderLieu: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationService = {
  alertErreurTitre: 'Publication impossible',
  legendeCategorie: 'Catégorie',
  categorieServiceTitre: 'Service',
  categorieServiceAide: 'Entre particulier·ères.',
  categorieVolontariatTitre: 'Volontariat',
  categorieVolontariatAide: 'Pour un collectif (association, commune, etc.).',
  legendeSens: 'Sens',
  sensPropose: "J'offre mon temps",
  sensCherche: "J'ai besoin d'aide",
  labelTitre: 'Titre',
  placeholderTitre: 'Exemple : Coup de main jardinage le samedi',
  labelDescription: 'Description',
  labelDuree: 'Durée estimée (en minutes)',
  hintDuree: '1 minute = 1 99-coin crédité après réalisation (modération 2 h).',
  labelLieu: 'Lieu',
  placeholderLieu: 'Ville ou quartier',
  ctaSubmit: 'Publier le service',
  ctaEnCours: 'Publication...',
};

interface FormulaireCreationServiceProps {
  creerServiceSel: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationService;
  messages?: MessagesValidationSel;
}

export function FormulaireCreationService({
  creerServiceSel,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_SEL_DEFAUT,
}: FormulaireCreationServiceProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerServiceSel>({
    resolver: zodResolver(creerServiceSelFactory(messages)),
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeCategorie}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="service"
              {...register('categorie')}
              className="mt-0.5 accent-brand"
            />
            <div>
              <p className="font-bold text-text-1">{libelles.categorieServiceTitre}</p>
              <p className="text-xs text-text-3">{libelles.categorieServiceAide}</p>
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
              <p className="font-bold text-text-1">{libelles.categorieVolontariatTitre}</p>
              <p className="text-xs text-text-3">{libelles.categorieVolontariatAide}</p>
            </div>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeSens}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="propose"
              {...register('sens')}
              className="mt-0.5 accent-brand"
            />
            <span>{libelles.sensPropose}</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="cherche"
              {...register('sens')}
              className="mt-0.5 accent-brand"
            />
            <span>{libelles.sensCherche}</span>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="sel-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="sel-titre" placeholder={libelles.placeholderTitre} {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="sel-description" obligatoire>
          {libelles.labelDescription}
        </Label>
        <Textarea id="sel-description" rows={6} {...register('description')} />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="sel-duree" obligatoire>
          {libelles.labelDuree}
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
        <p className="mt-1 text-xs text-text-3">{libelles.hintDuree}</p>
        {errors.duree_minutes_estimee !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.duree_minutes_estimee.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="sel-lieu" obligatoire>
          {libelles.labelLieu}
        </Label>
        <Input id="sel-lieu" placeholder={libelles.placeholderLieu} {...register('lieu')} />
        {errors.lieu !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.lieu.message}</p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

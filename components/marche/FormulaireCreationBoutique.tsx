'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_MARCHE_DEFAUT,
  type MessagesValidationMarche,
} from '@/lib/messages-validation';
import { type DonneesCreerBoutique, creerBoutiqueFactory } from '@/lib/validations/marche';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.152). */
export interface LibellesCreationBoutique {
  alertErreurTitre: string;
  legendeSens: string;
  optionSensPropose: string;
  optionSensCherche: string;
  labelNom: string;
  placeholderNom: string;
  labelDescription: string;
  labelOuvertureDu: string;
  labelOuvertureAu: string;
  hintHoraires: string;
  labelLieu: string;
  placeholderLieu: string;
  libelleImage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationBoutique = {
  alertErreurTitre: 'Publication impossible',
  legendeSens: 'Sens',
  optionSensPropose: 'Je crée ma boutique',
  optionSensCherche: 'Je cherche à rejoindre ou co-créer',
  labelNom: 'Nom de la boutique',
  placeholderNom: 'Exemple : Vide-grenier de Saint-Denis',
  labelDescription: 'Description',
  labelOuvertureDu: 'Ouverture (début)',
  labelOuvertureAu: 'Fermeture (fin)',
  hintHoraires:
    'Laisser vide pour une boutique permanente. Sinon, indiquer la plage du vide-grenier ou de la brocante.',
  labelLieu: 'Lieu (optionnel)',
  placeholderLieu: 'Ville ou adresse',
  libelleImage: 'Image illustrative (optionnelle)',
  ctaSubmit: 'Publier la boutique',
  ctaEnCours: 'Publication...',
};

interface FormulaireCreationBoutiqueProps {
  creerBoutique: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationBoutique;
  messages?: MessagesValidationMarche;
}

export function FormulaireCreationBoutique({
  creerBoutique,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_MARCHE_DEFAUT,
}: FormulaireCreationBoutiqueProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerBoutique>({
    resolver: zodResolver(creerBoutiqueFactory(messages)),
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

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
            <span>{libelles.optionSensPropose}</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="cherche"
              {...register('sens')}
              className="mt-0.5 accent-brand"
            />
            <span>{libelles.optionSensCherche}</span>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="boutique-nom" obligatoire>
          {libelles.labelNom}
        </Label>
        <Input id="boutique-nom" placeholder={libelles.placeholderNom} {...register('nom')} />
        {errors.nom !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="boutique-description" obligatoire>
          {libelles.labelDescription}
        </Label>
        <Textarea id="boutique-description" rows={6} {...register('description')} />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="boutique-du">{libelles.labelOuvertureDu}</Label>
          <Input id="boutique-du" type="datetime-local" {...register('ouverte_du')} />
        </div>
        <div>
          <Label htmlFor="boutique-au">{libelles.labelOuvertureAu}</Label>
          <Input id="boutique-au" type="datetime-local" {...register('ouverte_au')} />
        </div>
      </div>
      <p className="text-xs text-text-3">{libelles.hintHoraires}</p>
      {errors.ouverte_du !== undefined ? (
        <p className="text-xs text-danger">{errors.ouverte_du.message}</p>
      ) : null}

      <div>
        <Label htmlFor="boutique-lieu">{libelles.labelLieu}</Label>
        <Input id="boutique-lieu" placeholder={libelles.placeholderLieu} {...register('lieu')} />
      </div>

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

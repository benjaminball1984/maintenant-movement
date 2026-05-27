'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import {
  MESSAGES_VALIDATION_ENTRAIDE_DEFAUT,
  type MessagesValidationEntraide,
} from '@/lib/messages-validation';
import {
  type DonneesCreerOffreEntraide,
  creerOffreEntraideFactory,
} from '@/lib/validations/entraide';
import type { TypeOffreEntraide } from '@/types/database';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireCreationOffreProps {
  /** Type pré-rempli depuis la page de création. La personne peut le changer si besoin. */
  typeParDefaut: TypeOffreEntraide;
  creerOffreEntraide: (
    donnees: unknown,
  ) => Promise<
    { ok: true; slug: string; type: TypeOffreEntraide } | { ok: false; message: string }
  >;
  messages?: MessagesValidationEntraide;
}

const ROUTES: Record<TypeOffreEntraide, string> = {
  hebergement: '/s-entraider/hebergement',
  transport: '/s-entraider/transport',
  pret_objet: '/s-entraider/qui-prete-tout',
  fruits_terre: '/s-entraider/fruits-de-la-terre',
};

export function FormulaireCreationOffre({
  typeParDefaut,
  creerOffreEntraide,
  messages = MESSAGES_VALIDATION_ENTRAIDE_DEFAUT,
}: FormulaireCreationOffreProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerOffreEntraide>({
    resolver: zodResolver(creerOffreEntraideFactory(messages)),
    defaultValues: {
      titre: '',
      description: '',
      type: typeParDefaut,
      sens: 'propose',
      lieu: '',
      latitude: null,
      longitude: null,
      image_url: '',
      meta: {},
      token_turnstile: '',
    },
  });

  function gererGeoChange(champ: 'latitude' | 'longitude') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (v === '') {
        setValue(champ, null, { shouldValidate: true });
        return;
      }
      const n = Number(v);
      setValue(champ, Number.isNaN(n) ? null : n, { shouldValidate: true });
    };
  }

  async function onSubmit(donnees: DonneesCreerOffreEntraide) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerOffreEntraide(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`${ROUTES[resultat.type]}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre="Publication impossible">
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">Type d'offre</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.values(SOUS_ESPACES).map((config) => (
            <label
              key={config.type}
              className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
            >
              <input
                type="radio"
                value={config.type}
                {...register('type')}
                className="mt-0.5 accent-brand"
              />
              <span className="font-bold text-text-1">{config.titre}</span>
            </label>
          ))}
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
            <span>Je propose / j'offre</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="cherche"
              {...register('sens')}
              className="mt-0.5 accent-brand"
            />
            <span>Je cherche / je demande</span>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="off-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="off-titre"
          placeholder="Exemple : Chambre à Marseille pour militante de passage"
          {...register('titre')}
        />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="off-description" obligatoire>
          Description
        </Label>
        <Textarea
          id="off-description"
          rows={6}
          placeholder="Précise le contexte, les conditions, ce qu'il faut savoir."
          {...register('description')}
        />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="off-lieu" obligatoire>
          Lieu
        </Label>
        <Input
          id="off-lieu"
          placeholder="Ville, quartier, ou adresse approximative"
          {...register('lieu')}
        />
        {errors.lieu !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.lieu.message}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="off-lat">Latitude (optionnel)</Label>
          <Input
            id="off-lat"
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            onChange={gererGeoChange('latitude')}
          />
        </div>
        <div>
          <Label htmlFor="off-lng">Longitude (optionnel)</Label>
          <Input
            id="off-lng"
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            onChange={gererGeoChange('longitude')}
          />
        </div>
      </div>

      <ChampImageObjet
        name="image_url"
        libelle="Image illustrative (optionnelle)"
        onChange={(url) => setValue('image_url', url ?? '')}
      />

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Publication...' : "Publier l'offre"}
      </Button>
      <p className="-mt-2 text-xs text-text-3">
        Publication immédiate (modération a posteriori). Le contact passe par la messagerie interne
        du réseau social.
      </p>
    </form>
  );
}

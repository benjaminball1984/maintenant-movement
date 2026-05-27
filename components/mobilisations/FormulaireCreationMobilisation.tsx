'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_MOBILISATION_DEFAUT,
  type MessagesValidationMobilisation,
} from '@/lib/messages-validation';
import {
  type DonneesCreerMobilisation,
  creerMobilisationFactory,
} from '@/lib/validations/mobilisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.149). */
export interface LibellesCreationMobilisation {
  alertErreurTitre: string;
  labelTitre: string;
  placeholderTitre: string;
  labelDescription: string;
  placeholderDescription: string;
  labelLieu: string;
  placeholderLieu: string;
  labelLatitude: string;
  placeholderLatitude: string;
  labelLongitude: string;
  placeholderLongitude: string;
  hintGeo: string;
  labelDateDebut: string;
  labelDateFin: string;
  labelImage: string;
  ctaSubmit: string;
  ctaEnCours: string;
  notePublication: string;
}

const LIBELLES_DEFAUT: LibellesCreationMobilisation = {
  alertErreurTitre: 'Création impossible',
  labelTitre: 'Titre',
  placeholderTitre: 'Exemple : Manif climat samedi 23 mai',
  labelDescription: 'Description',
  placeholderDescription:
    "Décris l'événement, le déroulé, ce qu'il faut savoir. 50 à 3000 caractères.",
  labelLieu: 'Lieu',
  placeholderLieu: 'Exemple : Place de la République, Paris 11e',
  labelLatitude: 'Latitude (optionnel)',
  placeholderLatitude: '48.8676',
  labelLongitude: 'Longitude (optionnel)',
  placeholderLongitude: '2.3631',
  hintGeo:
    'Coordonnées GPS pour la carte. Les deux ou aucune. Tu peux les copier depuis OpenStreetMap.',
  labelDateDebut: 'Date et heure de début',
  labelDateFin: 'Date et heure de fin (optionnel)',
  labelImage: 'Image illustrative (optionnelle)',
  ctaSubmit: 'Publier la mobilisation',
  ctaEnCours: 'Publication...',
  notePublication:
    "Publication immédiate (modération a posteriori). L'équipe Maintenant! peut retirer la mobilisation en cas de problème.",
};

interface FormulaireCreationMobilisationProps {
  creerMobilisation: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  /** Libelles UI surchargeables admin via CMS. */
  libelles?: LibellesCreationMobilisation;
  /** Messages de validation Zod surchargeables admin via CMS. */
  messages?: MessagesValidationMobilisation;
}

/**
 * Formulaire de création d'une mobilisation (Client Component).
 *
 * Champs : titre, description, lieu, lat/lng (optionnels), date_debut,
 * date_fin (optionnelle), image_url (optionnelle).
 *
 * Les `datetime-local` HTML renvoient des chaînes sans timezone (« 2026-05-23T14:00 »).
 * On les convertit en ISO 8601 UTC avant l'envoi pour satisfaire le
 * schéma Zod (`.datetime()`) côté serveur.
 */
export function FormulaireCreationMobilisation({
  creerMobilisation,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_MOBILISATION_DEFAUT,
}: FormulaireCreationMobilisationProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerMobilisation>({
    resolver: zodResolver(creerMobilisationFactory(messages)),
    defaultValues: {
      titre: '',
      description: '',
      lieu: '',
      latitude: null,
      longitude: null,
      image_url: '',
      date_debut: '',
      date_fin: '',
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerMobilisation) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerMobilisation(donnees);
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/mobiliser/mobilisations/${resultat.slug}`);
  }

  /**
   * Lit la valeur d'un `<input type="datetime-local">` et la convertit
   * en ISO 8601 UTC (`Z`). Si la valeur est vide, met une chaîne vide
   * (Zod tolère `.or(z.literal(''))` pour date_fin).
   */
  function gererDateChange(champ: 'date_debut' | 'date_fin') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (v === '') {
        setValue(champ, '', { shouldValidate: true });
        return;
      }
      const iso = new Date(v).toISOString();
      setValue(champ, iso, { shouldValidate: true });
    };
  }

  /**
   * Coerce la valeur numérique d'un `<input type="number">` en
   * `number | null`. Vide → null (cohérent avec le schéma).
   */
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

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="mob-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="mob-titre" placeholder={libelles.placeholderTitre} {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="mob-description" obligatoire>
          {libelles.labelDescription}
        </Label>
        <Textarea
          id="mob-description"
          rows={8}
          placeholder={libelles.placeholderDescription}
          {...register('description')}
        />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="mob-lieu" obligatoire>
          {libelles.labelLieu}
        </Label>
        <Input id="mob-lieu" placeholder={libelles.placeholderLieu} {...register('lieu')} />
        {errors.lieu !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.lieu.message}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="mob-lat">{libelles.labelLatitude}</Label>
          <Input
            id="mob-lat"
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            placeholder={libelles.placeholderLatitude}
            onChange={gererGeoChange('latitude')}
          />
          {errors.latitude !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.latitude.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="mob-lng">{libelles.labelLongitude}</Label>
          <Input
            id="mob-lng"
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            placeholder={libelles.placeholderLongitude}
            onChange={gererGeoChange('longitude')}
          />
          {errors.longitude !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.longitude.message}</p>
          ) : null}
        </div>
      </div>
      <p className="-mt-3 text-xs text-text-3">{libelles.hintGeo}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="mob-debut" obligatoire>
            {libelles.labelDateDebut}
          </Label>
          <Input id="mob-debut" type="datetime-local" onChange={gererDateChange('date_debut')} />
          {errors.date_debut !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.date_debut.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="mob-fin">{libelles.labelDateFin}</Label>
          <Input id="mob-fin" type="datetime-local" onChange={gererDateChange('date_fin')} />
          {errors.date_fin !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.date_fin.message}</p>
          ) : null}
        </div>
      </div>

      <ChampImageObjet
        name="image_url"
        libelle={libelles.labelImage}
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      {errors.image_url !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.image_url.message}</p>
      ) : null}

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <div className="flex gap-3">
        <Button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
        </Button>
      </div>
      <p className="-mt-2 text-xs text-text-3">{libelles.notePublication}</p>
    </form>
  );
}

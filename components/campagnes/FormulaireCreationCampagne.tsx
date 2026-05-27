'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
  type MessagesValidationCampagne,
} from '@/lib/messages-validation';
import { type DonneesCreerCampagne, creerCampagneFactory } from '@/lib/validations/campagne';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.149). */
export interface LibellesCreationCampagne {
  alertErreurTitre: string;
  labelTitre: string;
  placeholderTitre: string;
  labelTexte: string;
  placeholderTexte: string;
  hintTexte: string;
  labelImage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationCampagne = {
  alertErreurTitre: 'Création impossible',
  labelTitre: 'Titre',
  placeholderTitre: "Exemple : Stop à l'autoroute A69",
  labelTexte: 'Présentation de la campagne',
  placeholderTexte:
    'Décris le combat, le contexte, ce que tu veux assembler comme modules. 100 à 5000 caractères.',
  hintTexte:
    'Tu pourras attacher des modules (pétition, mobilisation, ...) une fois la campagne validée.',
  labelImage: 'Image illustrative (optionnelle)',
  ctaSubmit: 'Soumettre pour modération',
  ctaEnCours: 'Envoi...',
};

interface FormulaireCreationCampagneProps {
  creerCampagne: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string; campagne_id: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationCampagne;
  messages?: MessagesValidationCampagne;
}

/**
 * Formulaire de création d'une campagne (Client Component).
 *
 * Une fois la campagne créée (statut en_moderation), la créateurice
 * peut commencer à y attacher des modules depuis la fiche détail. Pour
 * 3.2 v1, l'attachement de modules est exposé uniquement via la console
 * admin / l'API (Server Action `attacherModule`) — une UI dédiée
 * d'édition des modules viendra dans un chantier polish.
 */
export function FormulaireCreationCampagne({
  creerCampagne,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
}: FormulaireCreationCampagneProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerCampagne>({
    resolver: zodResolver(creerCampagneFactory(messages)),
    defaultValues: {
      titre: '',
      texte: '',
      image_url: '',
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerCampagne) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerCampagne(donnees);
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/mobiliser/campagnes/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="camp-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="camp-titre" placeholder={libelles.placeholderTitre} {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="camp-texte" obligatoire>
          {libelles.labelTexte}
        </Label>
        <Textarea
          id="camp-texte"
          rows={10}
          placeholder={libelles.placeholderTexte}
          {...register('texte')}
        />
        <p className="mt-1 text-xs text-text-3">{libelles.hintTexte}</p>
        {errors.texte !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.texte.message}</p>
        ) : null}
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
    </form>
  );
}

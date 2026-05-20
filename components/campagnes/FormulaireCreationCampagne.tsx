'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { type DonneesCreerCampagne, creerCampagneSchema } from '@/lib/validations/campagne';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireCreationCampagneProps {
  creerCampagne: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string; campagne_id: string } | { ok: false; message: string }>;
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
export function FormulaireCreationCampagne({ creerCampagne }: FormulaireCreationCampagneProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerCampagne>({
    resolver: zodResolver(creerCampagneSchema),
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
        <Alert variant="danger" titre="Création impossible">
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="camp-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="camp-titre"
          placeholder="Exemple : Stop à l'autoroute A69"
          {...register('titre')}
        />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="camp-texte" obligatoire>
          Présentation de la campagne
        </Label>
        <Textarea
          id="camp-texte"
          rows={10}
          placeholder="Décris le combat, le contexte, ce que tu veux assembler comme modules. 100 à 5000 caractères."
          {...register('texte')}
        />
        <p className="mt-1 text-xs text-text-3">
          Tu pourras attacher des modules (pétition, mobilisation, ...) une fois la campagne
          validée.
        </p>
        {errors.texte !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.texte.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="camp-image">Image (URL, optionnel)</Label>
        <Input id="camp-image" type="url" placeholder="https://..." {...register('image_url')} />
        {errors.image_url !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.image_url.message}</p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <div className="flex gap-3">
        <Button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? 'Envoi...' : 'Soumettre pour modération'}
        </Button>
      </div>
    </form>
  );
}

'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import { type DonneesCreerPetition, creerPetitionSchema } from '@/lib/validations/petition';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireCreationPetitionProps {
  /**
   * Server Action de création. Reçue par prop pour conserver une
   * frontière nette client/serveur (cf. ADR-002 sur les Server Actions
   * passées en props plutôt qu'importées côté client).
   */
  creerPetition: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
}

/**
 * Formulaire de création d'une pétition (composant client).
 *
 * Champs (cf. `lib/validations/petition.ts`) :
 *   - titre (5-200)
 *   - texte (100-5000)
 *   - destinataire (5-200)
 *   - image_url (optionnel)
 *   - objectif (entier 100-1 000 000)
 *
 * Sur succès, redirige vers la fiche détail. La pétition apparaîtra en
 * attente de modération : la créatrice la voit grâce à la RLS, le reste
 * du public ne la voit qu'une fois publiée.
 */
export function FormulaireCreationPetition({ creerPetition }: FormulaireCreationPetitionProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerPetition>({
    resolver: zodResolver(creerPetitionSchema),
    defaultValues: {
      titre: '',
      texte: '',
      destinataire: '',
      image_url: '',
      // useForm `defaultValue` doit être typé : on met 100 (le minimum)
      // pour éviter une valeur undefined transformée en NaN par Zod.
      objectif: 1000,
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerPetition) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerPetition(donnees);
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/mobiliser/petitions/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre="Création impossible">
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="petition-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="petition-titre"
          placeholder="Exemple : Pour le retour des trains de nuit en Auvergne"
          {...register('titre')}
        />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="petition-destinataire" obligatoire>
          Destinataire
        </Label>
        <Input
          id="petition-destinataire"
          placeholder="Exemple : Ministre des Transports"
          {...register('destinataire')}
        />
        <p className="mt-1 text-xs text-text-3">
          À qui s'adresse cette pétition (institution, élu·e, entreprise).
        </p>
        {errors.destinataire !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.destinataire.message}</p>
        ) : null}
      </div>

      <ChampImageObjet
        name="image_url"
        libelle="Image illustrative (optionnelle)"
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      {errors.image_url !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.image_url.message}</p>
      ) : null}

      <div>
        <Label htmlFor="petition-texte" obligatoire>
          Texte de la pétition
        </Label>
        <Textarea
          id="petition-texte"
          rows={10}
          placeholder="Décris le problème et la demande. Argumente. 100 à 5000 caractères."
          {...register('texte')}
        />
        {errors.texte !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.texte.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="petition-objectif" obligatoire>
          Objectif chiffré (nombre de signataires)
        </Label>
        <Input
          id="petition-objectif"
          type="number"
          inputMode="numeric"
          min={100}
          max={1_000_000}
          step={100}
          // valueAsNumber : sans cela RHF renvoie une string et Zod
          // refuse au lieu de coercer.
          {...register('objectif', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-text-3">
          Entre 100 et 1 000 000. Au franchissement de 90 %, l'objectif sera étiré ×1,5.
        </p>
        {errors.objectif !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.objectif.message}</p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <div className="flex gap-3">
        <Button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? 'Envoi en cours...' : 'Soumettre pour modération'}
        </Button>
      </div>
    </form>
  );
}

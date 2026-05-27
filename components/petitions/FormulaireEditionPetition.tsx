'use client';

import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_PETITION_DEFAUT,
  type MessagesValidationPetition,
} from '@/lib/messages-validation';
import { type DonneesEditerPetition, creerEditerPetitionSchema } from '@/lib/validations/petition';
import type { Petition } from '@/types/database';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireEditionPetitionProps {
  /** Pétition à éditer (toutes colonnes, dont les dates). */
  petition: Petition;
  /**
   * Server Action d'édition, reçue en prop (cf. ADR-002 : frontière nette
   * client/serveur, on ne l'importe pas côté client).
   */
  editerPetition: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  messages?: MessagesValidationPetition;
}

/**
 * Convertit une valeur `timestamptz` (ISO, ou null) en valeur d'input
 * `type="date"` au format `AAAA-MM-JJ`. Les dates sont stockées à minuit,
 * donc tronquer les 10 premiers caractères suffit (pas de décalage de
 * fuseau introduit par `new Date()`).
 */
function versInputDate(valeur: string | null): string {
  return valeur ? valeur.slice(0, 10) : '';
}

/**
 * Formulaire d'édition d'une pétition par l'équipe (admin / modération).
 *
 * Reprend les champs de contenu (titre, destinataire, image, texte,
 * objectif) et ajoute les deux dates métier (lancement, échéance,
 * cf. migration 035). À la différence du formulaire de création, pas de
 * Turnstile : l'accès est déjà restreint par le layout `/admin` et par la
 * RLS.
 */
export function FormulaireEditionPetition({
  petition,
  editerPetition,
  messages = MESSAGES_VALIDATION_PETITION_DEFAUT,
}: FormulaireEditionPetitionProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesEditerPetition>({
    resolver: zodResolver(creerEditerPetitionSchema(messages)),
    defaultValues: {
      petition_id: petition.id,
      titre: petition.titre,
      texte: petition.texte,
      destinataire: petition.destinataire,
      image_url: petition.image_url ?? '',
      objectif: petition.objectif,
      date_lancement: versInputDate(petition.date_lancement),
      date_echeance: versInputDate(petition.date_echeance),
    },
  });

  async function onSubmit(donnees: DonneesEditerPetition) {
    setErreur(null);
    setSucces(false);
    setEnvoiEnCours(true);
    const resultat = await editerPetition(donnees);
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
    // Rafraîchit les Server Components (liste admin, page publique) pour
    // refléter immédiatement les modifications.
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre="Édition impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Modifications enregistrées">
          La pétition a été mise à jour.
        </Alert>
      ) : null}

      <input type="hidden" {...register('petition_id')} />

      <div>
        <Label htmlFor="edit-titre" obligatoire>
          Titre
        </Label>
        <Input id="edit-titre" {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="edit-destinataire" obligatoire>
          Destinataire
        </Label>
        <Input id="edit-destinataire" {...register('destinataire')} />
        {errors.destinataire !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.destinataire.message}</p>
        ) : null}
      </div>

      <ChampImageObjet
        name="image_url"
        libelle="Image illustrative (optionnelle)"
        valeurInitiale={petition.image_url}
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      {errors.image_url !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.image_url.message}</p>
      ) : null}

      <div>
        <Label htmlFor="edit-texte" obligatoire>
          Texte de la pétition
        </Label>
        <Textarea id="edit-texte" rows={10} {...register('texte')} />
        {errors.texte !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.texte.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="edit-objectif" obligatoire>
          Objectif chiffré (nombre de signataires)
        </Label>
        <Input
          id="edit-objectif"
          type="number"
          inputMode="numeric"
          min={100}
          max={1_000_000}
          step={100}
          {...register('objectif', { valueAsNumber: true })}
        />
        {errors.objectif !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.objectif.message}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-date-lancement">Date de lancement (optionnel)</Label>
          <Input id="edit-date-lancement" type="date" {...register('date_lancement')} />
          <p className="mt-1 text-xs text-text-3">Début officiel de la campagne.</p>
          {errors.date_lancement !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.date_lancement.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="edit-date-echeance">Date d'échéance (optionnel)</Label>
          <Input id="edit-date-echeance" type="date" {...register('date_echeance')} />
          <p className="mt-1 text-xs text-text-3">Date limite affichée publiquement.</p>
          {errors.date_echeance !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.date_echeance.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  );
}

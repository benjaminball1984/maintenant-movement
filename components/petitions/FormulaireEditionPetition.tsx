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

/** Libelles surchargeables admin via CMS (V2.4.152). */
export interface LibellesEditionPetition {
  alertErreurTitre: string;
  alertSuccesTitre: string;
  alertSuccesCorps: string;
  labelTitre: string;
  labelDestinataire: string;
  libelleImage: string;
  labelTexte: string;
  labelObjectif: string;
  labelDateLancement: string;
  hintDateLancement: string;
  labelDateEcheance: string;
  hintDateEcheance: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesEditionPetition = {
  alertErreurTitre: 'Édition impossible',
  alertSuccesTitre: 'Modifications enregistrées',
  alertSuccesCorps: 'La pétition a été mise à jour.',
  labelTitre: 'Titre',
  labelDestinataire: 'Destinataire',
  libelleImage: 'Image illustrative (optionnelle)',
  labelTexte: 'Texte de la pétition',
  labelObjectif: 'Objectif chiffré (nombre de signataires)',
  labelDateLancement: 'Date de lancement (optionnel)',
  hintDateLancement: 'Début officiel de la campagne.',
  labelDateEcheance: "Date d'échéance (optionnel)",
  hintDateEcheance: 'Date limite affichée publiquement.',
  ctaSubmit: 'Enregistrer les modifications',
  ctaEnCours: 'Enregistrement...',
};

interface FormulaireEditionPetitionProps {
  /** Pétition à éditer (toutes colonnes, dont les dates). */
  petition: Petition;
  /**
   * Server Action d'édition, reçue en prop (cf. ADR-002 : frontière nette
   * client/serveur, on ne l'importe pas côté client).
   */
  editerPetition: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesEditionPetition;
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
  libelles = LIBELLES_DEFAUT,
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre={libelles.alertSuccesTitre}>
          {libelles.alertSuccesCorps}
        </Alert>
      ) : null}

      <input type="hidden" {...register('petition_id')} />

      <div>
        <Label htmlFor="edit-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="edit-titre" {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="edit-destinataire" obligatoire>
          {libelles.labelDestinataire}
        </Label>
        <Input id="edit-destinataire" {...register('destinataire')} />
        {errors.destinataire !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.destinataire.message}</p>
        ) : null}
      </div>

      <ChampImageObjet
        name="image_url"
        libelle={libelles.libelleImage}
        valeurInitiale={petition.image_url}
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      {errors.image_url !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.image_url.message}</p>
      ) : null}

      <div>
        <Label htmlFor="edit-texte" obligatoire>
          {libelles.labelTexte}
        </Label>
        <Textarea id="edit-texte" rows={10} {...register('texte')} />
        {errors.texte !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.texte.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="edit-objectif" obligatoire>
          {libelles.labelObjectif}
        </Label>
        <Input
          id="edit-objectif"
          type="number"
          inputMode="numeric"
          min={100}
          max={10_000_000}
          step={100}
          {...register('objectif', { valueAsNumber: true })}
        />
        {errors.objectif !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.objectif.message}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-date-lancement">{libelles.labelDateLancement}</Label>
          <Input id="edit-date-lancement" type="date" {...register('date_lancement')} />
          <p className="mt-1 text-xs text-text-3">{libelles.hintDateLancement}</p>
          {errors.date_lancement !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.date_lancement.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="edit-date-echeance">{libelles.labelDateEcheance}</Label>
          <Input id="edit-date-echeance" type="date" {...register('date_echeance')} />
          <p className="mt-1 text-xs text-text-3">{libelles.hintDateEcheance}</p>
          {errors.date_echeance !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.date_echeance.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
        </Button>
      </div>
    </form>
  );
}

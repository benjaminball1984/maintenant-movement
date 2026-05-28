'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { SelectEtoiles } from '@/components/marche/NotationEtoiles';
import { Alert, Button, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_MARCHE_DEFAUT,
  type MessagesValidationMarche,
} from '@/lib/messages-validation';
import {
  type DonneesNoterVendeureuse,
  creerNoterVendeureuseSchema,
} from '@/lib/validations/marche';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.152). */
export interface LibellesNotation {
  alertErreurTitre: string;
  labelEtoiles: string;
  labelCommentaire: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesNotation = {
  alertErreurTitre: 'Notation impossible',
  labelEtoiles: "Combien d'étoiles ?",
  labelCommentaire: 'Commentaire (optionnel)',
  ctaSubmit: 'Publier la notation',
  ctaEnCours: 'Envoi...',
};

interface FormulaireNotationProps {
  produitId: string;
  noterVendeureuse: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesNotation;
  messages?: MessagesValidationMarche;
}

/**
 * Formulaire de notation 5 étoiles unilatérale (cf. spec §6F).
 *
 * S'affiche seulement après que le produit a été marqué `vendu` par
 * la vendeureuse (la BDD refuse les notations sur les autres statuts).
 */
export function FormulaireNotation({
  produitId,
  noterVendeureuse,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_MARCHE_DEFAUT,
}: FormulaireNotationProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<DonneesNoterVendeureuse>({
    resolver: zodResolver(creerNoterVendeureuseSchema(messages)),
    defaultValues: {
      produit_id: produitId,
      etoiles: 5,
      commentaire: '',
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesNoterVendeureuse) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await noterVendeureuse(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...register('produit_id')} />
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="notation-etoiles">{libelles.labelEtoiles}</Label>
        <Controller
          name="etoiles"
          control={control}
          render={({ field }) => (
            <SelectEtoiles
              valeur={field.value}
              onChange={field.onChange}
              idPrefixe="notation-etoile"
            />
          )}
        />
        {errors.etoiles !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.etoiles.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="notation-commentaire">{libelles.labelCommentaire}</Label>
        <Textarea id="notation-commentaire" rows={4} {...register('commentaire')} />
        {errors.commentaire !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.commentaire.message}</p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

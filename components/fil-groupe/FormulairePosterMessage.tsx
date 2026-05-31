'use client';

import { posterDansFilGroupe } from '@/app/actions/fil-groupe';
import { Button } from '@/components/ui';
import type { EspaceTypeFil } from '@/lib/fil-groupe';
import { LONGUEUR_MAX_MESSAGE, LONGUEUR_MIN_MESSAGE } from '@/lib/fil-groupe-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

/**
 * Formulaire de saisie d'un message dans le fil de groupe (cycle V2 §18,
 * V2.2.1).
 *
 * Client Component minimaliste : un textarea + un bouton. Validation
 * côté client (longueur, non-vide) AVANT envoi pour éviter un aller-retour
 * réseau inutile ; la Server Action revalide côté serveur.
 */

/** Libelles surchargeables admin via CMS (V2.4.154). */
export interface LibellesPosterMessage {
  labelMessage: string;
  placeholderMessage: string;
  ctaSubmit: string;
  ctaEnCours: string;
  erreurVide: string;
  /** Substitue `{n}` par la longueur maximale autorisée. */
  erreurTropLong: string;
  erreurEnvoiImpossible: string;
  /** Substitue `{n}` par le nombre restant. */
  compteurRestant: string;
  /** Substitue `{n}` par le nombre en trop. */
  compteurTrop: string;
}

const LIBELLES_DEFAUT: LibellesPosterMessage = {
  labelMessage: 'Message',
  placeholderMessage: 'Écris ton message au groupe…',
  ctaSubmit: 'Publier',
  ctaEnCours: 'Envoi…',
  erreurVide: 'Le message ne peut pas être vide.',
  erreurTropLong: 'Le message dépasse {n} caractères.',
  erreurEnvoiImpossible: 'Envoi impossible. Réessaie dans un instant.',
  compteurRestant: '{n} caractères restants',
  compteurTrop: '{n} caractères de trop',
};

interface FormulairePosterMessageProps {
  espaceType: EspaceTypeFil;
  espaceId: string;
  cheminRevalidation?: string;
  libelles?: LibellesPosterMessage;
}

export function FormulairePosterMessage({
  espaceType,
  espaceId,
  cheminRevalidation,
  libelles = LIBELLES_DEFAUT,
}: FormulairePosterMessageProps) {
  const [erreur, setErreur] = useState<string | null>(null);

  // Schéma construit à partir des libellés CMS : la validation client passe par
  // zodResolver (C24) tout en gardant les messages éditables (§0bis.8).
  const schema = useMemo(
    () =>
      z.object({
        contenu: z
          .string()
          .trim()
          .min(LONGUEUR_MIN_MESSAGE, libelles.erreurVide)
          .max(
            LONGUEUR_MAX_MESSAGE,
            libelles.erreurTropLong.replace('{n}', String(LONGUEUR_MAX_MESSAGE)),
          ),
      }),
    [libelles.erreurVide, libelles.erreurTropLong],
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ contenu: string }>({
    resolver: zodResolver(schema),
    defaultValues: { contenu: '' },
  });
  const contenu = watch('contenu') ?? '';

  async function onSubmit(donnees: { contenu: string }) {
    setErreur(null);
    try {
      const resultat = await posterDansFilGroupe({
        espaceType,
        espaceId,
        contenu: donnees.contenu.trim(),
        cheminRevalidation,
      });
      if (resultat.ok) {
        reset({ contenu: '' });
      } else {
        setErreur(resultat.message);
      }
    } catch (_erreur) {
      setErreur(libelles.erreurEnvoiImpossible);
    }
  }

  // Erreur affichée : validation client (Zod) d'abord, sinon le message serveur/réseau.
  const messageErreur = errors.contenu?.message ?? erreur;
  const compteurRestant = LONGUEUR_MAX_MESSAGE - contenu.length;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <label htmlFor="fil-groupe-contenu" className="sr-only">
        {libelles.labelMessage}
      </label>
      <textarea
        id="fil-groupe-contenu"
        rows={3}
        disabled={isSubmitting}
        placeholder={libelles.placeholderMessage}
        maxLength={LONGUEUR_MAX_MESSAGE + 100}
        aria-invalid={messageErreur !== null && messageErreur !== undefined ? true : undefined}
        className="resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1 placeholder:text-text-4 focus:border-brand focus:outline-none"
        {...register('contenu')}
      />
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-xs ${compteurRestant < 0 ? 'text-danger' : 'text-text-3'}`}
          aria-live="polite"
        >
          {compteurRestant >= 0
            ? libelles.compteurRestant.replace('{n}', String(compteurRestant))
            : libelles.compteurTrop.replace('{n}', String(-compteurRestant))}
        </span>
        <Button
          type="submit"
          variant="primary"
          taille="sm"
          disabled={
            isSubmitting || contenu.trim().length === 0 || contenu.length > LONGUEUR_MAX_MESSAGE
          }
        >
          <Send size={16} aria-hidden="true" />
          {isSubmitting ? libelles.ctaEnCours : libelles.ctaSubmit}
        </Button>
      </div>
      {messageErreur !== null && messageErreur !== undefined && (
        <p role="alert" className="text-danger text-sm">
          {messageErreur}
        </p>
      )}
    </form>
  );
}

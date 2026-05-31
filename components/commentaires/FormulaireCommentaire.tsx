'use client';

import { poserCommentaireObjet } from '@/app/actions/commentaires';
import { Button } from '@/components/ui';
import type { ObjetCommentable } from '@/lib/commentaires';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

/** Longueur maximale d'un commentaire (alignée sur le schéma serveur). */
const COMMENTAIRE_MAX = 2000;

/**
 * Schéma de validation client du champ commentaire (C24). Mêmes bornes que le
 * `poserSchema` côté Server Action : source unique de la règle de longueur.
 */
const commentaireFormSchema = z.object({
  texte: z
    .string()
    .trim()
    .min(1, 'Le commentaire ne peut pas être vide.')
    .max(COMMENTAIRE_MAX, `Le commentaire est trop long (${COMMENTAIRE_MAX} caractères max).`),
});
type CommentaireForm = z.infer<typeof commentaireFormSchema>;

interface FormulaireCommentaireProps {
  objetType: ObjetCommentable;
  objetId: string;
  /** La personne est-elle connectée ? Détermine formulaire vs invitation. */
  connecte: boolean;
  cheminRevalidation: string;
}

/**
 * Formulaire de commentaire sous un contenu. Réservé aux connecté·es :
 * sinon, on affiche une invitation à se connecter (renvoi vers la page
 * courante après connexion). Au succès, vide le champ et rafraîchit la liste.
 */
export function FormulaireCommentaire({
  objetType,
  objetId,
  connecte,
  cheminRevalidation,
}: FormulaireCommentaireProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [statut, setStatut] = useState('');
  const idChamp = useId();
  const idErreur = `${idChamp}-erreur`;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentaireForm>({
    resolver: zodResolver(commentaireFormSchema),
    defaultValues: { texte: '' },
  });
  const texte = watch('texte') ?? '';

  if (!connecte) {
    return (
      <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-text-2">
        <Link
          href={`/connexion?prochaine=${encodeURIComponent(pathname)}`}
          className="font-medium text-brand hover:underline"
        >
          Connecte-toi
        </Link>{' '}
        pour participer à la discussion.
      </p>
    );
  }

  async function onSubmit(donnees: CommentaireForm) {
    setErreur(null);
    const r = await poserCommentaireObjet({
      objet_type: objetType,
      objet_id: objetId,
      texte: donnees.texte,
      cheminRevalidation,
    });
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    reset({ texte: '' });
    setStatut('Commentaire publié');
    router.refresh();
  }

  // Erreur affichée : la validation client (Zod) d'abord, sinon le message serveur.
  const messageErreur = errors.texte?.message ?? erreur;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
      <label htmlFor={idChamp} className="sr-only">
        Écrire un commentaire
      </label>
      <textarea
        id={idChamp}
        rows={3}
        maxLength={COMMENTAIRE_MAX}
        placeholder="Écris un commentaire…"
        aria-invalid={messageErreur !== null && messageErreur !== undefined ? true : undefined}
        aria-describedby={
          messageErreur !== null && messageErreur !== undefined ? idErreur : undefined
        }
        className="w-full rounded-md border border-border bg-surface p-3 text-sm text-text-1 placeholder:text-text-4"
        {...register('texte')}
      />
      {messageErreur !== null && messageErreur !== undefined ? (
        <p id={idErreur} className="text-danger text-xs">
          {messageErreur}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-3 text-xs">
          {texte.length}/{COMMENTAIRE_MAX}
        </span>
        <Button type="submit" taille="sm" disabled={isSubmitting || texte.trim() === ''}>
          {isSubmitting ? 'Envoi…' : 'Commenter'}
        </Button>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {statut}
      </span>
    </form>
  );
}

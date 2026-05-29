'use server';

/**
 * Server Actions des commentaires polymorphes (`commentaire_objet`).
 *
 * Chantier A (V2.6). La RLS reste la barrière de sécurité (insert réservé
 * aux connecté·es en leur propre nom ; retrait réservé auteurice/modération).
 * Ces actions valident les entrées et revalident la page concernée.
 */
import { getSession } from '@/lib/auth/session';
import { type ObjetCommentable, estObjetCommentable } from '@/lib/commentaires';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

const poserSchema = z.object({
  objet_type: z.string().refine(estObjetCommentable, 'Type de contenu non commentable.'),
  objet_id: z.string().uuid('Identifiant de contenu invalide.'),
  texte: z
    .string()
    .trim()
    .min(1, 'Le commentaire ne peut pas être vide.')
    .max(2000, 'Le commentaire est trop long (2000 caractères max).'),
  cheminRevalidation: z.string().optional(),
});

/**
 * Poste un commentaire sous un contenu. Réservé aux personnes connectées
 * (en plus de la RLS), au nom de la personne courante.
 */
export async function poserCommentaireObjet(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = poserSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const { objet_type, objet_id, texte, cheminRevalidation } = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour commenter.' };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('commentaire_objet').insert({
    objet_type: objet_type as ObjetCommentable,
    objet_id,
    auteurice_id: session.userId,
    texte,
  });
  if (error !== null) {
    return { ok: false, message: `Commentaire impossible : ${error.message}` };
  }

  if (cheminRevalidation !== undefined) revalidatePath(cheminRevalidation);
  return { ok: true };
}

const retirerSchema = z.object({
  id: z.string().uuid(),
  raison: z.string().trim().max(500).optional(),
  cheminRevalidation: z.string().optional(),
});

/**
 * Retire un commentaire (modération a posteriori). La RLS autorise
 * l'auteurice, la modération réseau ou un·e admin général·e.
 */
export async function retirerCommentaireObjet(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const { id, raison, cheminRevalidation } = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Action réservée aux personnes connectées.' };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('commentaire_objet')
    .update({
      statut: 'retire',
      retire_par: session.userId,
      retire_le: new Date().toISOString(),
      raison_retrait: raison ?? null,
    })
    .eq('id', id);
  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  if (cheminRevalidation !== undefined) revalidatePath(cheminRevalidation);
  return { ok: true };
}

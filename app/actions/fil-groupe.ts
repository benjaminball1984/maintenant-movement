'use server';

import { getSession } from '@/lib/auth/session';
import { type EspaceTypeFil, posterMessageFil, supprimerMessageFil } from '@/lib/fil-groupe';
import { validerContenuMessageFil } from '@/lib/fil-groupe-validation';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions du fil de groupe (cycle V2 §18, chantier V2.2.1).
 *
 * Toutes vérifient la session, valident l'entrée (Zod-light via les
 * helpers purs) et délèguent à `lib/fil-groupe.ts`. La RLS Supabase
 * couvre la défense en profondeur (n'écrit pas ce qu'il ne pourrait pas
 * écrire en passant directement par la BDD).
 *
 * Convention de retour : `{ ok: true, ... } | { ok: false, message }`,
 * cohérente avec les autres Server Actions du repo.
 */

export type ResultatPoster = { ok: true; messageId: string } | { ok: false; message: string };

export interface PosterDansFilOptions {
  espaceType: EspaceTypeFil;
  espaceId: string;
  contenu: string;
  parentId?: string | null;
  /** Chemin à revalider après le post (page de l'espace). */
  cheminRevalidation?: string;
}

export async function posterDansFilGroupe(options: PosterDansFilOptions): Promise<ResultatPoster> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise pour poster dans le fil.' };
  }

  const validation = validerContenuMessageFil(options.contenu);
  if (!validation.ok) {
    return {
      ok: false,
      message:
        validation.raison === 'vide'
          ? 'Le message ne peut pas être vide.'
          : 'Le message dépasse la longueur autorisée (4000 caractères).',
    };
  }

  const resultat = await posterMessageFil({
    espaceType: options.espaceType,
    espaceId: options.espaceId,
    auteurId: session.userId,
    contenu: validation.contenuNettoye,
    parentId: options.parentId ?? null,
  });

  if (!resultat.ok) {
    return { ok: false, message: resultat.message };
  }

  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }

  return { ok: true, messageId: resultat.message.id };
}

export interface SupprimerDansFilOptions {
  messageId: string;
  motif: string;
  cheminRevalidation?: string;
}

export async function supprimerDansFilGroupe(
  options: SupprimerDansFilOptions,
): Promise<{ ok: boolean; message?: string }> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const resultat = await supprimerMessageFil({
    messageId: options.messageId,
    supprimeParPersonneId: session.userId,
    motif: options.motif,
  });

  if (resultat.ok && options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }

  return resultat;
}

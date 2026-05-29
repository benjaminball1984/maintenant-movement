'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Action de mise à jour d'un contenu éditorial (CMS V2.4.1).
 * Vérifie le droit admin national.
 */

const schema = z.object({
  cle: z.string().min(1).max(200),
  titre: z.string().max(500).optional(),
  valeurMd: z.string().max(50000),
  cheminRevalidation: z.string().optional(),
});

export type ResultatMaj = { ok: true } | { ok: false; message: string };

export async function mettreAJourContenuEditorialAction(donnees: unknown): Promise<ResultatMaj> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  // V2.5.21 sous-chantier V2.5.15.b — autorisation étendue : les comptes
  // niveau CMS (rôle dédié sans pouvoir politique, cf. V2.5.15) peuvent
  // aussi éditer les libellés en plus des admins généraux.
  const { data: peutEditer } = await supabase.rpc('peut_editer_cms');
  if (peutEditer !== true) {
    return {
      ok: false,
      message: 'Action réservée aux comptes admin général ou rôle CMS.',
    };
  }

  const parse = schema.safeParse(donnees);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const { cle, titre, valeurMd, cheminRevalidation } = parse.data;

  const { error } = await supabase.from('contenu_editorial').upsert(
    {
      cle,
      titre: titre ?? null,
      valeur_md: valeurMd,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'cle' },
  );

  if (error !== null) {
    return { ok: false, message: error.message };
  }

  if (cheminRevalidation !== undefined && cheminRevalidation !== '') {
    revalidatePath(cheminRevalidation);
  }
  return { ok: true };
}

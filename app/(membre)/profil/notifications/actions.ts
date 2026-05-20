'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions des préférences de notifications (chantier 8.1).
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

const mettreAJourPreferencesSchema = z
  .object({
    cloche_active: z.boolean().optional(),
    push_active: z.boolean().optional(),
    mail_recap_mardi_active: z.boolean().optional(),
    newsletter_vendredi_active: z.boolean().optional(),
  })
  .strict();

export async function mettreAJourPreferencesNotification(
  donneesBrutes: unknown,
): Promise<ResultatAction> {
  const parse = mettreAJourPreferencesSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('preference_notification').upsert(
    {
      personne_id: session.userId,
      ...parse.data,
    },
    { onConflict: 'personne_id' },
  );
  if (error !== null) {
    return { ok: false, message: `Mise à jour impossible : ${error.message}` };
  }
  revalidatePath('/profil/notifications');
  return { ok: true };
}

export async function marquerNotificationLue(notificationId: string): Promise<ResultatAction> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  if (!/^[a-f0-9-]{36}$/.test(notificationId)) {
    return { ok: false, message: 'Identifiant invalide.' };
  }
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('notification')
    .update({ lue: true, lue_le: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('destinataire_id', session.userId);
  if (error !== null) {
    return { ok: false, message: `Mise à jour impossible : ${error.message}` };
  }
  revalidatePath('/profil/notifications');
  return { ok: true };
}

export async function marquerToutesLues(): Promise<ResultatAction<{ marquees: number }>> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const { count: avant } = await supabase
    .from('notification')
    .select('id', { count: 'exact', head: true })
    .eq('destinataire_id', session.userId)
    .eq('lue', false);
  await supabase
    .from('notification')
    .update({ lue: true, lue_le: new Date().toISOString() })
    .eq('destinataire_id', session.userId)
    .eq('lue', false);
  revalidatePath('/profil/notifications');
  return { ok: true, marquees: avant ?? 0 };
}

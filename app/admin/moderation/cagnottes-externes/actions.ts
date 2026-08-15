'use server';

import { estAdminCourant } from '@/lib/auth/admin';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Modération A PRIORI des collectes externes (V2.6.124, demande Ben).
 * Réservé à l'administration. « Approuver » publie la collecte (visible du
 * public) ; « Rejeter » la marque `refuse` (jamais re-proposée).
 */

export type ResultatModeration = { ok: true } | { ok: false; message: string };

const idSchema = z.string().uuid();
const raisonSchema = z.string().trim().max(500).optional();

async function horodatageAdmin(): Promise<{ id: string | null; iso: string } | null> {
  if (!(await estAdminCourant())) return null;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { id: user?.id ?? null, iso: new Date().toISOString() };
}

export async function approuverCagnotteExterne(id: unknown): Promise<ResultatModeration> {
  const parse = idSchema.safeParse(id);
  if (!parse.success) return { ok: false, message: 'Identifiant invalide.' };
  const admin = await horodatageAdmin();
  if (admin === null) return { ok: false, message: "Réservé à l'administration." };

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('cagnotte_externe')
    .update({ statut: 'publie', modere_par: admin.id, modere_le: admin.iso, raison_refus: null })
    .eq('id', parse.data);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/moderation/cagnottes-externes');
  revalidatePath('/mobiliser/cagnottes');
  return { ok: true };
}

export async function rejeterCagnotteExterne(
  id: unknown,
  raison: unknown,
): Promise<ResultatModeration> {
  const parseId = idSchema.safeParse(id);
  if (!parseId.success) return { ok: false, message: 'Identifiant invalide.' };
  const parseRaison = raisonSchema.safeParse(raison);
  if (!parseRaison.success) return { ok: false, message: 'Motif trop long.' };
  const admin = await horodatageAdmin();
  if (admin === null) return { ok: false, message: "Réservé à l'administration." };

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('cagnotte_externe')
    .update({
      statut: 'refuse',
      modere_par: admin.id,
      modere_le: admin.iso,
      raison_refus: parseRaison.data ?? null,
    })
    .eq('id', parseId.data);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/moderation/cagnottes-externes');
  revalidatePath('/mobiliser/cagnottes');
  return { ok: true };
}

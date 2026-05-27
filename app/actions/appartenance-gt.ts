'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions d'appartenance à un GT thématique (cycle V2 V2.3.38).
 *
 * Pattern aligné sur `appartenance-campagne.ts` (V2.3.34). Réactivation
 * si la personne a déjà quitté précédemment, insertion sinon.
 *
 * Réutilise la table V1 `appartenance_gt` (existe depuis chantier 1.1).
 */

export type ResultatAppartenance = { ok: true } | { ok: false; message: string };

export async function rejoindreGT(gtId: string): Promise<ResultatAppartenance> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise pour rejoindre un GT.' };
  }

  const supabase = await getSupabaseServer();

  const { data: gt } = await supabase
    .from('gt_thematique')
    .select('id, slug')
    .eq('id', gtId)
    .maybeSingle();
  if (gt === null) {
    return { ok: false, message: 'GT introuvable.' };
  }

  const { data: existante } = await supabase
    .from('appartenance_gt')
    .select('id, est_active')
    .eq('personne_id', session.userId)
    .eq('gt_thematique_id', gtId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existante?.est_active) {
    return { ok: true }; // idempotent
  }

  if (existante !== null) {
    const { error } = await supabase
      .from('appartenance_gt')
      .update({ est_active: true, quittee_le: null, rejointe_le: new Date().toISOString() })
      .eq('id', existante.id);
    if (error !== null) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from('appartenance_gt').insert({
      personne_id: session.userId,
      gt_thematique_id: gtId,
    });
    if (error !== null) return { ok: false, message: error.message };
  }

  revalidatePath(`/co-construire/${gt.slug}`);
  revalidatePath('/profil/mes-groupes');
  return { ok: true };
}

export async function quitterGT(gtId: string): Promise<ResultatAppartenance> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: gt } = await supabase
    .from('gt_thematique')
    .select('slug')
    .eq('id', gtId)
    .maybeSingle();

  const { error } = await supabase
    .from('appartenance_gt')
    .update({ est_active: false, quittee_le: new Date().toISOString() })
    .eq('personne_id', session.userId)
    .eq('gt_thematique_id', gtId)
    .eq('est_active', true);

  if (error !== null) return { ok: false, message: error.message };

  if (gt !== null) revalidatePath(`/co-construire/${gt.slug}`);
  revalidatePath('/profil/mes-groupes');
  return { ok: true };
}

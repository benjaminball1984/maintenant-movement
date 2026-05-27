'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions de gestion de l'appartenance à une campagne
 * (cycle V2 V2.3.34, complète V2.3.29).
 *
 * `rejoindreCampagne` : insère une ligne `est_active=true`. L'index
 * unique partiel V2.3.29 garantit l'idempotence (pas de doublon).
 * Si la personne a déjà quitté, on réactive la ligne existante.
 *
 * `quitterCampagne` : passe `est_active=false`, `quittee_le=now()`.
 */

export type ResultatAppartenance = { ok: true } | { ok: false; message: string };

export async function rejoindreCampagne(campagneId: string): Promise<ResultatAppartenance> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise pour rejoindre une campagne.' };
  }

  const supabase = await getSupabaseServer();

  // Vérifie que la campagne existe.
  const { data: campagne } = await supabase
    .from('campagne')
    .select('id, slug')
    .eq('id', campagneId)
    .maybeSingle();
  if (campagne === null) {
    return { ok: false, message: 'Campagne introuvable.' };
  }

  // Cherche une appartenance existante (active ou non).
  const { data: existante } = await supabase
    .from('appartenance_campagne')
    .select('id, est_active')
    .eq('personne_id', session.userId)
    .eq('campagne_id', campagneId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existante?.est_active) {
    return { ok: true }; // déjà membre, idempotent
  }

  if (existante !== null) {
    // Réactive la ligne existante (quittée précédemment).
    const { error } = await supabase
      .from('appartenance_campagne')
      .update({ est_active: true, quittee_le: null, rejointe_le: new Date().toISOString() })
      .eq('id', existante.id);
    if (error !== null) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from('appartenance_campagne').insert({
      personne_id: session.userId,
      campagne_id: campagneId,
    });
    if (error !== null) return { ok: false, message: error.message };
  }

  revalidatePath(`/mobiliser/campagnes/${campagne.slug}`);
  revalidatePath('/profil/mes-groupes');
  return { ok: true };
}

export async function quitterCampagne(campagneId: string): Promise<ResultatAppartenance> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: campagne } = await supabase
    .from('campagne')
    .select('slug')
    .eq('id', campagneId)
    .maybeSingle();

  const { error } = await supabase
    .from('appartenance_campagne')
    .update({ est_active: false, quittee_le: new Date().toISOString() })
    .eq('personne_id', session.userId)
    .eq('campagne_id', campagneId)
    .eq('est_active', true);

  if (error !== null) return { ok: false, message: error.message };

  if (campagne !== null) {
    revalidatePath(`/mobiliser/campagnes/${campagne.slug}`);
  }
  revalidatePath('/profil/mes-groupes');
  return { ok: true };
}

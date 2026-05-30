'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

type ResultatSimple = { ok: true } | { ok: false; message: string };

const EMPLACEMENTS = ['petition', 'article', 'mobilisation', 'cagnotte'] as const;

/**
 * Épingle un contenu à la une de la home pour un emplacement (chantier
 * V2.6.19). Réservé à l'admin (la RPC `definir_une_home` vérifie le droit).
 */
export async function definirUneHomeAction(donneesBrutes: unknown): Promise<ResultatSimple> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const o =
    typeof donneesBrutes === 'object' && donneesBrutes !== null
      ? (donneesBrutes as { emplacement?: unknown; objet_id?: unknown })
      : {};
  if (
    typeof o.emplacement !== 'string' ||
    !(EMPLACEMENTS as readonly string[]).includes(o.emplacement) ||
    typeof o.objet_id !== 'string'
  ) {
    return { ok: false, message: 'Données invalides.' };
  }
  const supabase = await getSupabaseServer();
  const { data: ok } = await supabase.rpc('definir_une_home', {
    p_emplacement: o.emplacement,
    p_objet_id: o.objet_id,
  });
  if (ok !== true) {
    return { ok: false, message: 'Action réservée à l’administration.' };
  }
  revalidatePath('/');
  return { ok: true };
}

/** Retire l'épinglage d'un emplacement (retour à l'automatique). Admin. */
export async function retirerUneHomeAction(donneesBrutes: unknown): Promise<ResultatSimple> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const o =
    typeof donneesBrutes === 'object' && donneesBrutes !== null
      ? (donneesBrutes as { emplacement?: unknown })
      : {};
  if (typeof o.emplacement !== 'string') {
    return { ok: false, message: 'Données invalides.' };
  }
  const supabase = await getSupabaseServer();
  const { data: ok } = await supabase.rpc('retirer_une_home', { p_emplacement: o.emplacement });
  if (ok !== true) {
    return { ok: false, message: 'Action réservée à l’administration.' };
  }
  revalidatePath('/');
  return { ok: true };
}

'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const schemaEdition = z.object({
  titre: z.string().min(1).max(300),
  sous_titre: z.string().max(500).optional(),
  numero: z.number().int().positive(),
  format: z.enum(['A3', 'A4']),
  contenu_md: z.string().max(50000).optional(),
  image_couverture_url: z.string().url().optional(),
  publier: z.boolean().optional(),
});

export type ResultatEdition = { ok: true; slug: string } | { ok: false; message: string };

/**
 * Crée une nouvelle édition de journal-affiche (V2.4.13).
 *
 * Action serveur réservée aux admins généraux. Numéro géré côté admin
 * (séquence simple à incrémenter manuellement, pas de génération auto
 * pour laisser le contrôle éditorial à la rédaction).
 */
export async function creerEditionJournalAction(donnees: unknown): Promise<ResultatEdition> {
  const session = await getSession();
  if (session === null) return { ok: false, message: 'Connexion requise.' };

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) return { ok: false, message: 'Action réservée aux admins.' };

  const parse = schemaEdition.safeParse(donnees);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  }

  const d = parse.data;
  const baseSlug = slugify(d.titre);
  const { data: existant } = await supabase
    .from('journal_affiche')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle();
  const slug = existant === null ? baseSlug : `${baseSlug}-${d.numero}`;

  const { error } = await supabase.from('journal_affiche').insert({
    slug,
    titre: d.titre,
    sous_titre: d.sous_titre ?? null,
    numero: d.numero,
    format: d.format,
    contenu_md: d.contenu_md ?? '',
    image_couverture_url: d.image_couverture_url ?? null,
    statut: d.publier === true ? 'publie' : 'brouillon',
    publie_le: d.publier === true ? new Date().toISOString() : null,
    createurice_id: session.userId,
  });

  if (error !== null) return { ok: false, message: error.message };

  revalidatePath('/s-informer/journal');
  revalidatePath('/admin/national/journal');
  return { ok: true, slug };
}

const schemaStatut = z.object({
  id: z.string().uuid(),
  statut: z.enum(['brouillon', 'publie', 'archive']),
});

export async function changerStatutEditionAction(
  donnees: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (session === null) return { ok: false, message: 'Connexion requise.' };

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) return { ok: false, message: 'Action réservée aux admins.' };

  const parse = schemaStatut.safeParse(donnees);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  }

  const { error } = await supabase
    .from('journal_affiche')
    .update({
      statut: parse.data.statut,
      publie_le: parse.data.statut === 'publie' ? new Date().toISOString() : null,
    })
    .eq('id', parse.data.id);

  if (error !== null) return { ok: false, message: error.message };

  revalidatePath('/s-informer/journal');
  revalidatePath('/admin/national/journal');
  return { ok: true };
}

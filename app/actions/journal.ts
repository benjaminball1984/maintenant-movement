'use server';

import { getSession } from '@/lib/auth/session';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { slugifier } from '@/lib/slug';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schemaEdition = z.object({
  titre: z.string().min(1).max(300),
  sous_titre: z.string().max(500).optional(),
  numero: z.number().int().positive(),
  format: z.enum(['A3', 'A4']),
  contenu_md: z.string().max(50000).optional(),
  /** V2.5.33 — version HTML riche optionnelle (sanitizée avant insertion). */
  contenu_html: z.string().max(200000).optional(),
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
  const baseSlug = slugifier(d.titre);
  const { data: existant } = await supabase
    .from('journal_affiche')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle();
  const slug = existant === null ? baseSlug : `${baseSlug}-${d.numero}`;

  // V2.5.33 — sanitize HTML riche avant insertion. Allowlist stricte
  // de balises/attributs/CSS, cf. `lib/rich-text/sanitize.ts`.
  const contenuHtmlPropre =
    d.contenu_html !== undefined && d.contenu_html.trim() !== ''
      ? sanitizeRichHtml(d.contenu_html)
      : null;

  const { error } = await supabase.from('journal_affiche').insert({
    slug,
    titre: d.titre,
    sous_titre: d.sous_titre ?? null,
    numero: d.numero,
    format: d.format,
    contenu_md: d.contenu_md ?? '',
    contenu_html: contenuHtmlPropre,
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

const schemaMaj = z.object({
  id: z.string().uuid(),
  titre: z.string().min(1).max(300).optional(),
  sous_titre: z.string().max(500).nullable().optional(),
  contenu_md: z.string().max(50000).optional(),
  /** V2.5.33 — HTML riche optionnel. Vide → efface (retour Markdown). */
  contenu_html: z.string().max(200000).optional(),
  image_couverture_url: z.string().url().nullable().optional(),
  numero: z.number().int().positive().optional(),
  format: z.enum(['A3', 'A4']).optional(),
});

/**
 * Met à jour une édition existante (V2.4.19). Admin uniquement.
 * Permet d'éditer titre / sous-titre / contenu / couverture / numéro / format.
 */
export async function mettreAJourEditionAction(
  donnees: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (session === null) return { ok: false, message: 'Connexion requise.' };

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) return { ok: false, message: 'Action réservée aux admins.' };

  const parse = schemaMaj.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };

  const d = parse.data;
  const maj: {
    titre?: string;
    sous_titre?: string | null;
    contenu_md?: string;
    contenu_html?: string | null;
    image_couverture_url?: string | null;
    numero?: number;
    format?: 'A3' | 'A4';
  } = {};
  if (d.titre !== undefined) maj.titre = d.titre;
  if (d.sous_titre !== undefined) maj.sous_titre = d.sous_titre;
  if (d.contenu_md !== undefined) maj.contenu_md = d.contenu_md;
  if (d.contenu_html !== undefined) {
    // V2.5.33 — vide = effacer le HTML riche (retour Markdown).
    maj.contenu_html = d.contenu_html.trim() === '' ? null : sanitizeRichHtml(d.contenu_html);
  }
  if (d.image_couverture_url !== undefined) maj.image_couverture_url = d.image_couverture_url;
  if (d.numero !== undefined) maj.numero = d.numero;
  if (d.format !== undefined) maj.format = d.format;

  if (Object.keys(maj).length === 0) {
    return { ok: false, message: 'Rien à modifier.' };
  }

  // Charge le slug pour revalider la page publique.
  const { data: row } = await supabase
    .from('journal_affiche')
    .select('slug')
    .eq('id', d.id)
    .maybeSingle();

  const { error } = await supabase.from('journal_affiche').update(maj).eq('id', d.id);
  if (error !== null) return { ok: false, message: error.message };

  revalidatePath('/s-informer/journal');
  revalidatePath('/admin/national/journal');
  if (row?.slug !== undefined) revalidatePath(`/s-informer/journal/${row.slug}`);
  return { ok: true };
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

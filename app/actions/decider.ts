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

const schemaSalle = z.object({
  nom: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  espace_type: z.enum([
    'commune',
    'federation',
    'confederation',
    'gt_thematique',
    'campagne',
    'groupe_entraide_local',
    'national',
  ]),
  espace_id: z.string().uuid().optional(),
  type_visibilite: z.enum(['membres', 'fedeere', 'public']),
});

export type Resultat = { ok: true; slug: string } | { ok: false; message: string };

export async function creerSalleDeciderAction(donnees: unknown): Promise<Resultat> {
  const session = await getSession();
  if (session === null) return { ok: false, message: 'Connexion requise.' };

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) return { ok: false, message: 'Action réservée aux admins.' };

  const parse = schemaSalle.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };

  const d = parse.data;
  const baseSlug = slugify(d.nom);
  // Slug unique : suffixe avec timestamp si collision.
  const { data: existant } = await supabase
    .from('salle_decider')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle();
  const slug = existant === null ? baseSlug : `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

  const { error } = await supabase.from('salle_decider').insert({
    slug,
    nom: d.nom,
    description: d.description ?? null,
    espace_type: d.espace_type,
    espace_id: d.espace_id ?? null,
    type_visibilite: d.type_visibilite,
    createurice_id: session.userId,
  });

  if (error !== null) return { ok: false, message: error.message };

  revalidatePath('/s-informer/decider');
  revalidatePath('/admin/national/decider');
  return { ok: true, slug };
}

const schemaReunion = z.object({
  salle_id: z.string().uuid(),
  titre: z.string().min(1).max(300),
  ordre_jour_md: z.string().max(20000).optional(),
  debut_le: z.string(),
  fin_le: z.string().optional(),
  mode_decision: z.enum(['consensus', 'levee_objections', 'jugement_majoritaire']),
});

export async function creerReunionAction(
  donnees: unknown,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const session = await getSession();
  if (session === null) return { ok: false, message: 'Connexion requise.' };

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) return { ok: false, message: 'Action réservée aux admins.' };

  const parse = schemaReunion.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };

  const d = parse.data;
  const { data, error } = await supabase
    .from('reunion_decider')
    .insert({
      salle_id: d.salle_id,
      titre: d.titre,
      ordre_jour_md: d.ordre_jour_md ?? '',
      debut_le: d.debut_le,
      fin_le: d.fin_le ?? null,
      mode_decision: d.mode_decision,
      convoque_par_personne_id: session.userId,
    })
    .select('id')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Insertion impossible.' };
  }

  revalidatePath('/s-informer/decider');
  revalidatePath('/admin/national/decider');
  return { ok: true, id: data.id };
}

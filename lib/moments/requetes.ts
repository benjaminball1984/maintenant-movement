import { getSupabaseServer } from '@/lib/supabase';
import type { MomentSolidaire, TypeMomentSolidaire } from '@/types/database';

/**
 * Couche de requêtes des Moments solidaires (chantier 5.3).
 */

export interface MomentSolidaireEnrichi extends MomentSolidaire {
  createurice_prenom: string | null;
  createurice_nom: string | null;
  nombre_participants: number;
  /** RDV enfants pour le porte-à-porte (vide si autre type). */
  enfants: MomentSolidaire[];
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

async function hydrater(
  supabase: ClientSupabase,
  moments: MomentSolidaire[],
): Promise<MomentSolidaireEnrichi[]> {
  if (moments.length === 0) return [];
  const ids = moments.map((m) => m.id);
  const idsCreaturices = [...new Set(moments.map((m) => m.createurice_id))];

  const [personnes, participations, enfants] = await Promise.all([
    supabase.from('personne').select('id, prenom, nom').in('id', idsCreaturices),
    supabase.from('participation_moment').select('moment_id').in('moment_id', ids),
    supabase.from('moment_solidaire').select('*').in('parent_id', ids).order('commence_le'),
  ]);

  const idxPersonnes = new Map(
    (personnes.data ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]),
  );
  const compteurParts = new Map<string, number>();
  for (const p of participations.data ?? []) {
    compteurParts.set(p.moment_id, (compteurParts.get(p.moment_id) ?? 0) + 1);
  }
  const enfantsParParent = new Map<string, MomentSolidaire[]>();
  for (const e of (enfants.data ?? []) as MomentSolidaire[]) {
    if (e.parent_id === null) continue;
    const liste = enfantsParParent.get(e.parent_id) ?? [];
    liste.push(e);
    enfantsParParent.set(e.parent_id, liste);
  }

  return moments.map((m) => {
    const p = idxPersonnes.get(m.createurice_id);
    return {
      ...m,
      createurice_prenom: p?.prenom ?? null,
      createurice_nom: p?.nom ?? null,
      nombre_participants: compteurParts.get(m.id) ?? 0,
      enfants: enfantsParParent.get(m.id) ?? [],
    };
  });
}

export interface FiltreMoments {
  type?: TypeMomentSolidaire;
  /** Si true, on n'affiche que les moments parents (pas les 7 RDV enfants). */
  parentsSeulement?: boolean;
}

export async function listerMomentsSolidaires(
  filtre: FiltreMoments = {},
  limite = 50,
): Promise<MomentSolidaireEnrichi[]> {
  const supabase = await getSupabaseServer();
  let q = supabase
    .from('moment_solidaire')
    .select('*')
    .in('statut', ['annonce', 'en_cours'])
    .order('commence_le', { ascending: true })
    .limit(limite);
  if (filtre.type !== undefined) q = q.eq('type', filtre.type);
  if (filtre.parentsSeulement === true) q = q.is('parent_id', null);
  const { data } = await q;
  if (data === null) return [];
  return hydrater(supabase, data as MomentSolidaire[]);
}

export async function momentSolidaireParSlug(slug: string): Promise<MomentSolidaireEnrichi | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('moment_solidaire')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (data === null) return null;
  const [h] = await hydrater(supabase, [data as MomentSolidaire]);
  return h ?? null;
}

/**
 * Liste des Tupperwares d'un moment (lecture réservée à
 * l'organisateurice + admin par RLS).
 */
export async function listerTupperwaresDuMoment(momentId: string) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('tupperware')
    .select('*')
    .eq('moment_id', momentId)
    .order('emporte_le', { ascending: false });
  return data ?? [];
}

'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions d'archivage admin pour les entités V1 (V2.4.101).
 *
 * Doctrine §0.3 : on n'efface jamais physiquement les données ; on
 * passe par un statut « archivé / retiré / cloturé / annulé » qui
 * masque l'entité de l'UI publique mais conserve la ligne en base.
 *
 * Toutes les actions sont gardées par `est_admin_general` (RPC).
 * Champ raison optionnel, max 500 chars.
 */

const schemaArchivage = z.object({
  id: z.string().uuid(),
  raison: z.string().min(1).max(500).optional(),
});

export type ResultatArchivage = { ok: true } | { ok: false; message: string };

async function gardeAdmin(): Promise<true | ResultatArchivage> {
  const session = await getSession();
  if (session === null) return { ok: false, message: 'Connexion requise.' };
  const supabase = await getSupabaseServer();
  const { data } = await supabase.rpc('est_admin_general');
  if (data !== true) return { ok: false, message: 'Action réservée aux admins.' };
  return true;
}

async function appliquerMaj(
  table: 'cagnotte' | 'mobilisation' | 'campagne' | 'moment_solidaire' | 'media' | 'sondage',
  id: string,
  champs: Record<string, string | null>,
  pathsRevalider: string[],
): Promise<ResultatArchivage> {
  const supabase = await getSupabaseServer();
  // biome-ignore lint/suspicious/noExplicitAny: helper générique multi-tables
  const { error } = await (supabase.from(table) as any).update(champs).eq('id', id);
  if (error !== null) return { ok: false, message: `Échec : ${error.message}` };
  for (const p of pathsRevalider) revalidatePath(p);
  return { ok: true };
}

export async function archiverCagnotteAction(donnees: unknown): Promise<ResultatArchivage> {
  const garde = await gardeAdmin();
  if (garde !== true) return garde;
  const parse = schemaArchivage.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  return appliquerMaj(
    'cagnotte',
    parse.data.id,
    { statut: 'cloturee', raison_suspension: parse.data.raison ?? null },
    ['/mobiliser/cagnottes', '/admin/moderation/cagnottes'],
  );
}

export async function retirerMobilisationAction(donnees: unknown): Promise<ResultatArchivage> {
  const garde = await gardeAdmin();
  if (garde !== true) return garde;
  const parse = schemaArchivage.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  return appliquerMaj(
    'mobilisation',
    parse.data.id,
    { statut: 'retiree', raison_retrait: parse.data.raison ?? null },
    ['/mobiliser/mobilisations', '/admin/moderation/mobilisations'],
  );
}

export async function archiverCampagneAction(donnees: unknown): Promise<ResultatArchivage> {
  const garde = await gardeAdmin();
  if (garde !== true) return garde;
  const parse = schemaArchivage.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  return appliquerMaj(
    'campagne',
    parse.data.id,
    { statut: 'archivee', raison_rejet: parse.data.raison ?? null },
    ['/mobiliser/campagnes', '/admin/national/campagnes'],
  );
}

export async function annulerMomentAction(donnees: unknown): Promise<ResultatArchivage> {
  const garde = await gardeAdmin();
  if (garde !== true) return garde;
  const parse = schemaArchivage.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  return appliquerMaj('moment_solidaire', parse.data.id, { statut: 'retire' }, [
    '/agir/moments-solidaires',
    '/admin/national/moments',
  ]);
}

export async function retirerMediaAction(donnees: unknown): Promise<ResultatArchivage> {
  const garde = await gardeAdmin();
  if (garde !== true) return garde;
  const parse = schemaArchivage.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  return appliquerMaj(
    'media',
    parse.data.id,
    { statut: 'retire', raison_retrait: parse.data.raison ?? null },
    ['/s-informer/media', '/admin/national/medias'],
  );
}

export async function fermerSondageAction(donnees: unknown): Promise<ResultatArchivage> {
  const garde = await gardeAdmin();
  if (garde !== true) return garde;
  const parse = schemaArchivage.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  return appliquerMaj('sondage', parse.data.id, { statut: 'ferme' }, [
    '/s-informer/sondages',
    '/admin/national/sondages',
  ]);
}

// ============================================================
// SUPPRESSION DÉFINITIVE (DELETE physique) — admin uniquement
// ============================================================
/**
 * Server Action de suppression définitive d'une entité créée par
 * erreur (V2.4.102). DROP physique en base, irréversible.
 *
 * **Contrevient à la doctrine §0.3** (« on n'efface jamais ») mais
 * légitime pour les cas :
 * - Pétition publiée par erreur, jamais signée
 * - Cagnotte de test
 * - Mobilisation dupliquée
 * - etc.
 *
 * Garde-fous :
 * 1. Réservé `est_admin_general` (RPC, niveau national)
 * 2. Double confirmation côté UI : il faut taper le nom de la table
 *    pour confirmer
 * 3. Server Action exige `confirmation` = nom de la table exact
 *
 * Cas où on REFUSE même pour admin (à durcir plus tard) :
 * - Pétition avec signatures (pour ne pas perdre les engagements)
 * - Cagnotte avec dons confirmés
 *
 * Pour ces cas, utiliser `archiver*` qui masque sans détruire.
 */
const schemaSuppression = z.object({
  table: z.enum([
    'petition',
    'cagnotte',
    'mobilisation',
    'campagne',
    'moment_solidaire',
    'media',
    'sondage',
  ]),
  id: z.string().uuid(),
  /** Doit valoir le nom de la table — preuve que l'opérateurice a lu. */
  confirmation: z.string(),
});

export async function supprimerEntiteDefinitivementAction(
  donnees: unknown,
): Promise<ResultatArchivage> {
  const garde = await gardeAdmin();
  if (garde !== true) return garde;
  const parse = schemaSuppression.safeParse(donnees);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? 'Invalide.' };
  const { table, id, confirmation } = parse.data;

  if (confirmation !== table) {
    return {
      ok: false,
      message: `Confirmation incorrecte. Tape exactement « ${table} » pour confirmer.`,
    };
  }

  // Garde-fou métier : refus si signatures (pétition) ou dons confirmés (cagnotte).
  const supabase = await getSupabaseServer();
  if (table === 'petition') {
    const { count } = await supabase
      .from('signature_petition')
      .select('id', { count: 'exact', head: true })
      .eq('petition_id', id);
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        message: `Refus : cette pétition a ${count} signature(s). Archiver au lieu de supprimer.`,
      };
    }
  }
  if (table === 'cagnotte') {
    const { count } = await supabase
      .from('don')
      .select('id', { count: 'exact', head: true })
      .eq('cagnotte_id', id)
      .eq('statut', 'confirme');
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        message: `Refus : cette cagnotte a ${count} don(s) confirmé(s). Archiver au lieu de supprimer.`,
      };
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: helper générique multi-tables
  const { error } = await (supabase.from(table) as any).delete().eq('id', id);
  if (error !== null) return { ok: false, message: `Suppression impossible : ${error.message}` };

  // Revalide tous les chemins potentiellement concernés
  for (const p of [
    `/mobiliser/${table === 'petition' ? 'petitions' : table === 'cagnotte' ? 'cagnottes' : 'mobilisations'}`,
    '/admin/petitions',
    '/admin/moderation/petitions',
    '/admin/national/medias',
    '/admin/national/moments',
    '/admin/national/sondages',
    '/admin/national/campagnes',
  ]) {
    revalidatePath(p);
  }
  return { ok: true };
}

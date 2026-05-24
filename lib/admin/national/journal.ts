import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import type { Json } from '@/types/database';

/**
 * Journalisation des actions admin dans `journal_admin` (audit log RGPD,
 * cf. migration 009 et `docs/specs/05_RGPD.md` §5K).
 *
 * Toute mutation déclenchée depuis la console nationale doit être tracée :
 * qui a fait quoi, sur quelle cible, et l'état avant/après. Le journal est
 * immuable (pas d'UPDATE ni DELETE en RLS) et consultable par l'admin
 * nationale et le·la DPD uniquement.
 */

/** Une entrée à consigner dans le journal d'audit. */
export interface EntreeJournal {
  /** Verbe d'action stable, ex. `droit.accorde`, `droit.retire`. */
  action: string;
  /** Table concernée, ex. `droit_admin`. */
  cibleTable?: string | null;
  /** Identifiant de la ligne concernée. */
  cibleId?: string | null;
  /** État avant mutation (pour les mises à jour et suppressions). */
  ancienEtat?: Json;
  /** État après mutation (pour les créations et mises à jour). */
  nouvelEtat?: Json;
}

/**
 * Écrit une entrée dans `journal_admin`.
 *
 * Best-effort : un échec de journalisation ne doit jamais faire échouer
 * l'action métier déjà réalisée (on log l'incident côté serveur). L'`admin_id`
 * est dérivé de la session courante ; l'IP et le user-agent ne sont pas
 * captés ici (pas d'accès aux headers depuis ce helper) et restent à null.
 */
export async function journaliser(entree: EntreeJournal): Promise<void> {
  try {
    const session = await getSession();
    const supabase = await getSupabaseServer();

    await supabase.from('journal_admin').insert({
      admin_id: session?.userId ?? null,
      action: entree.action,
      cible_table: entree.cibleTable ?? null,
      cible_id: entree.cibleId ?? null,
      ancien_etat: entree.ancienEtat ?? null,
      nouvel_etat: entree.nouvelEtat ?? null,
    });
  } catch (erreur) {
    console.warn('[journaliser] échec de journalisation :', erreur);
  }
}

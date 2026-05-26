'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Server Action de mise à jour de la préférence de thème en BDD.
 *
 * Exigence transversale ET3 du cycle V2 (`docs/cdc-v2/01b-EXIGENCES-TRANSVERSALES-UI.md`) :
 * le bouton de bascule clair/sombre doit être branché sur `personne.mode_theme`
 * (colonne déjà existante depuis le chantier 1.1, contraint à
 * `auto | light | dark`). Avant V2.0.3, le `ThemeToggle` ne persistait qu'en
 * `localStorage` ; l'utilisateurice connecté·e perdait sa préférence d'un
 * appareil à l'autre.
 *
 * Conception (compromis V2.0.3) :
 *
 * - Cette action est appelée en **fire-and-forget** depuis le composant
 *   client après l'écriture localStorage. Le retour est intentionnellement
 *   silencieux : un échec réseau ou une absence de session ne doit pas
 *   bloquer l'utilisateurice qui a juste cliqué un bouton de thème.
 * - **Pas de revalidatePath** : changer de thème ne modifie aucune donnée
 *   affichée dans les pages serveur. Le `data-theme` sur `<html>` est posé
 *   côté client.
 * - **Pas de redirect ni Zod lourd** : la colonne `personne.mode_theme`
 *   porte déjà une contrainte CHECK BDD (`auto | light | dark`). On valide
 *   en TypeScript que la valeur fait partie des trois littéraux, et la
 *   contrainte CHECK est la deuxième ligne de défense.
 * - **RLS** : la mise à jour passe par le client Supabase serveur authentifié.
 *   Une personne ne peut mettre à jour que son propre `personne.id` via les
 *   policies posées au chantier 1.1.
 *
 * Lecture initiale de la préférence en BDD (cas user qui change d'appareil)
 * : reportée à un chantier ultérieur. Il faudra propager `mode_theme` depuis
 *   `getSession()` jusqu'au layout, puis au script anti-FOUC via cookie ou
 *   prop. Hors périmètre V2.0.3 (fondation, pas finalisation).
 */

type ModeThemeBdd = 'auto' | 'light' | 'dark';

const MODES_AUTORISES = new Set<ModeThemeBdd>(['auto', 'light', 'dark']);

function estModeValide(mode: unknown): mode is ModeThemeBdd {
  return typeof mode === 'string' && MODES_AUTORISES.has(mode as ModeThemeBdd);
}

/**
 * Met à jour `personne.mode_theme` pour la personne connectée.
 *
 * Retourne `{ ok: true }` en cas de succès, `{ ok: false }` sinon (sans
 * détails — l'appelant·e est en fire-and-forget, on évite de fuiter
 * d'information côté client).
 */
export async function mettreAJourMaPreferenceTheme(
  mode: unknown,
): Promise<{ ok: true } | { ok: false }> {
  if (!estModeValide(mode)) {
    return { ok: false };
  }

  const session = await getSession();
  if (session === null) {
    // Pas de session : on ne fait rien, ce n'est pas une erreur. L'utilisateurice
    // non connecté·e n'a que le localStorage comme source de vérité.
    return { ok: false };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('personne')
    .update({ mode_theme: mode })
    .eq('id', session.userId);

  if (error !== null) {
    return { ok: false };
  }

  return { ok: true };
}

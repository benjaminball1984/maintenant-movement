'use server';

import { getSession } from '@/lib/auth/session';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Action de mise à jour d'un contenu éditorial (CMS V2.4.1).
 * Vérifie le droit admin national.
 */

const schema = z.object({
  cle: z.string().min(1).max(200),
  titre: z.string().max(500).optional(),
  /** Optionnel V2.5.23 : si absent, on garde la valeur existante en base. */
  valeurMd: z.string().max(50000).optional(),
  /** V2.5.23 rich text — HTML enrichi optionnel (sanitizé avant insertion).
   *  Si la chaîne est vide, on remet la colonne à NULL (suppression du HTML
   *  riche, retour au fallback Markdown).
   */
  valeurHtml: z.string().max(200000).optional(),
  cheminRevalidation: z.string().optional(),
});

export type ResultatMaj = { ok: true } | { ok: false; message: string };

export async function mettreAJourContenuEditorialAction(donnees: unknown): Promise<ResultatMaj> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  // V2.5.21 sous-chantier V2.5.15.b — autorisation étendue : les comptes
  // niveau CMS (rôle dédié sans pouvoir politique, cf. V2.5.15) peuvent
  // aussi éditer les libellés en plus des admins généraux.
  //
  // V2.5.23 hotfix — fallback gracieux sur est_admin_general() si le RPC
  // peut_editer_cms n'existe pas (migration 20260530300000 pas encore
  // appliquée sur le distant Francfort, Master Plan local strict jusqu'à
  // Phase M). Comme ça les admins généraux peuvent éditer sans attendre
  // la propagation de la migration.
  const { data: peutEditer, error: errPeut } = await supabase.rpc('peut_editer_cms');
  let autorise = peutEditer === true;
  if (!autorise && errPeut !== null) {
    const { data: estAdmin } = await supabase.rpc('est_admin_general');
    autorise = estAdmin === true;
  }
  if (!autorise) {
    return {
      ok: false,
      message: 'Action réservée aux comptes admin général ou rôle CMS.',
    };
  }

  const parse = schema.safeParse(donnees);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const { cle, titre, valeurMd, valeurHtml, cheminRevalidation } = parse.data;

  // V2.5.23 — sanitization du HTML riche avant insertion. Allowlist stricte
  // de balises/attributs/CSS, cf. `lib/rich-text/sanitize.ts`. En base on
  // stocke du HTML déjà propre, pas besoin de re-sanitize à la lecture.
  const valeurHtmlPropre =
    valeurHtml !== undefined && valeurHtml.trim() !== '' ? sanitizeRichHtml(valeurHtml) : null;

  // Mises à jour partielles : on lit l'existant pour ne pas écraser
  // valeur_md quand on n'édite que valeur_html (ou inversement). L'upsert
  // de Supabase remplace TOUS les champs, donc on doit reconstruire la
  // ligne complète.
  const { data: existant } = await supabase
    .from('contenu_editorial')
    .select('titre, valeur_md, valeur_html')
    .eq('cle', cle)
    .maybeSingle();

  const titreFinal = titre !== undefined ? titre : (existant?.titre ?? null);
  const valeurMdFinale =
    valeurMd !== undefined ? valeurMd : ((existant?.valeur_md as string | undefined) ?? '');
  // Pour valeur_html : si valeurHtml absent du payload, on garde l'existant.
  // Si présent mais vide (''), valeurHtmlPropre = null → on EFFACE la
  // version riche (retour explicite au Markdown).
  const valeurHtmlFinale =
    valeurHtml !== undefined
      ? valeurHtmlPropre
      : ((existant as { valeur_html?: string | null } | null)?.valeur_html ?? null);

  const { error } = await supabase.from('contenu_editorial').upsert(
    {
      cle,
      titre: titreFinal,
      valeur_md: valeurMdFinale,
      valeur_html: valeurHtmlFinale,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'cle' },
  );

  if (error !== null) {
    return { ok: false, message: error.message };
  }

  if (cheminRevalidation !== undefined && cheminRevalidation !== '') {
    revalidatePath(cheminRevalidation);
  }
  return { ok: true };
}

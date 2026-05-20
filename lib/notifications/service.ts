import { getEmailService } from '@/lib/email';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { PreferenceNotification } from '@/types/database';

/**
 * Service de notifications (chantier 8.1).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §10` :
 *   « 5 canaux hiérarchisés. Préférences par canal et type. »
 *   « On ne capte pas l'attention, on la respecte. »
 *   « Deux mails par semaine maximum (mardi récap + vendredi
 *     newsletter). »
 *
 * Centralise la logique : avant chaque envoi, on consulte les
 * préférences de la personne et on filtre par canal et par type.
 *
 * Pour 8.1 v1 :
 *   - in-app (cloche) : insertion directe en BDD.
 *   - mails : via EmailService (Brevo en prod, mock par défaut).
 *   - push : pas implémenté en 8.1 v1 (web push API à brancher en
 *     polish ou chantier dédié).
 */

export interface DeclencheurNotification {
  destinataireId: string;
  type: string;
  titre: string;
  message?: string | null;
  href?: string | null;
  cibleTable?: string | null;
  cibleId?: string | null;
  /**
   * Canaux à activer en plus de la cloche (toujours active sauf opt-out).
   * Mail récap mardi et newsletter vendredi sont des envois groupés ;
   * on ne les active pas en synchrone ici. Push : v2.
   */
  envoyerMailImmediat?: boolean;
  emailDestinataire?: string | null;
}

/**
 * Crée une notification in-app et, selon les préférences + le canal
 * demandé, envoie un mail immédiat.
 */
export async function declencherNotification(
  d: DeclencheurNotification,
): Promise<{ envoyees: { cloche: boolean; mail: boolean } }> {
  const supabase = getSupabaseAdmin();
  const prefs = await chargerOuCreerPreferences(d.destinataireId);

  let clocheEnvoyee = false;
  let mailEnvoye = false;

  if (prefs.cloche_active && estAutoriseParType(prefs, d.type)) {
    await supabase.from('notification').insert({
      destinataire_id: d.destinataireId,
      type: d.type,
      titre: d.titre,
      message: d.message ?? null,
      href: d.href ?? null,
      cible_table: d.cibleTable ?? null,
      cible_id: d.cibleId ?? null,
    });
    clocheEnvoyee = true;
  }

  if (
    d.envoyerMailImmediat === true &&
    d.emailDestinataire !== undefined &&
    d.emailDestinataire !== null &&
    d.emailDestinataire !== ''
  ) {
    await getEmailService().envoyerTransactionnel({
      destinataire: d.emailDestinataire,
      sujet: d.titre,
      html: `<p>${d.message ?? ''}</p>${d.href !== undefined && d.href !== null ? `<p><a href="${d.href}">Voir</a></p>` : ''}`,
      texte: `${d.message ?? ''}\n\n${d.href ?? ''}`,
    });
    mailEnvoye = true;
  }

  return { envoyees: { cloche: clocheEnvoyee, mail: mailEnvoye } };
}

async function chargerOuCreerPreferences(personneId: string): Promise<PreferenceNotification> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('preference_notification')
    .select('*')
    .eq('personne_id', personneId)
    .maybeSingle();
  if (data !== null) return data;

  // Première insertion avec valeurs par défaut.
  const { data: cree } = await supabase
    .from('preference_notification')
    .insert({ personne_id: personneId })
    .select('*')
    .single();
  // Si l'insert échoue (race condition), on retourne un défaut.
  return (
    cree ?? {
      personne_id: personneId,
      cloche_active: true,
      push_active: false,
      mail_recap_mardi_active: true,
      newsletter_vendredi_active: true,
      preferences_par_type: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );
}

/**
 * Renvoie true si l'utilisateurice a explicitement opt-out de ce type
 * de notification. Par défaut on autorise tout.
 */
function estAutoriseParType(prefs: PreferenceNotification, type: string): boolean {
  const tabPrefs = prefs.preferences_par_type as Record<string, boolean> | null;
  if (tabPrefs === null || typeof tabPrefs !== 'object') return true;
  const valeur = tabPrefs[type];
  return valeur === undefined || valeur === true;
}

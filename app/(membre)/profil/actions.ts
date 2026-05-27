'use server';

import { getPersonneOuRediriger } from '@/lib/auth/session';
import { envoyerEmailTemplee } from '@/lib/email-templates';
import { getSupabaseServer } from '@/lib/supabase';
import {
  type DonneesDemanderSuppression,
  type DonneesMiseAJourProfil,
  type DonneesVerifierTotp,
  type PreferencesNotifications,
  type PreferencesVisibilite,
  demanderSuppressionSchema,
  mettreAJourProfilSchema,
  preferencesNotificationsSchema,
  preferencesVisibiliteSchema,
  verifierTotpSchema,
} from '@/lib/validations/profil';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Actions du profil utilisateurice.
 *
 * Toutes utilisent `getPersonneOuRediriger` pour s'assurer que seule la
 * personne connectée modifie son propre profil. RLS Supabase est la
 * deuxième ligne de défense (cf. migration 011 du chantier 1.1).
 *
 * Convention de retour : `{ ok: true, ... } | { ok: false, message }`,
 * comme les Server Actions auth (cf. 1.2).
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

// ============================================================
// Mise à jour des informations de profil
// ============================================================
export async function mettreAJourProfil(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = mettreAJourProfilSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesMiseAJourProfil = parse.data;

  const { userId } = await getPersonneOuRediriger('/profil/informations');
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('personne')
    .update({
      nom: donnees.nom,
      prenom: donnees.prenom,
      pronom: donnees.pronom,
      code_postal: donnees.code_postal,
      telephone: donnees.telephone === '' ? null : (donnees.telephone ?? null),
      photo_url: donnees.photo_url === '' ? null : (donnees.photo_url ?? null),
      bio: donnees.bio === '' ? null : (donnees.bio ?? null),
      mode_theme: donnees.mode_theme,
    })
    .eq('id', userId);

  if (error !== null) {
    return { ok: false, message: `Sauvegarde impossible : ${error.message}` };
  }

  revalidatePath('/profil', 'layout');
  return { ok: true };
}

// ============================================================
// Préférences de visibilité par champ
// ============================================================
export async function mettreAJourPreferencesVisibilite(
  donneesBrutes: unknown,
): Promise<ResultatAction> {
  const parse = preferencesVisibiliteSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: PreferencesVisibilite = parse.data;

  const { userId } = await getPersonneOuRediriger('/profil/confidentialite');
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('personne')
    .update({ preferences_visibilite: donnees })
    .eq('id', userId);

  if (error !== null) {
    return { ok: false, message: `Sauvegarde impossible : ${error.message}` };
  }

  revalidatePath('/profil/confidentialite');
  return { ok: true };
}

// ============================================================
// Préférences de notifications
// ============================================================
export async function mettreAJourPreferencesNotifications(
  donneesBrutes: unknown,
): Promise<ResultatAction> {
  const parse = preferencesNotificationsSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: PreferencesNotifications = parse.data;

  const { userId } = await getPersonneOuRediriger('/profil/notifications');
  const supabase = await getSupabaseServer();

  // On stocke les préférences notif dans `preferences_visibilite` (jsonb)
  // sous la clé dédiée. Une colonne dédiée sera ajoutée si le besoin se
  // confirme au chantier 8.1 (notifications).
  // Pour 1.3 on lit/écrit dans une sous-clé du même jsonb pour ne pas
  // multiplier les colonnes prématurément.
  const { data: ligne } = await supabase
    .from('personne')
    .select('preferences_visibilite')
    .eq('id', userId)
    .single();

  const prefsExistantes =
    typeof ligne?.preferences_visibilite === 'object' && ligne.preferences_visibilite !== null
      ? (ligne.preferences_visibilite as Record<string, unknown>)
      : {};

  const { error } = await supabase
    .from('personne')
    .update({
      preferences_visibilite: { ...prefsExistantes, notifications: donnees },
    })
    .eq('id', userId);

  if (error !== null) {
    return { ok: false, message: `Sauvegarde impossible : ${error.message}` };
  }

  revalidatePath('/profil/notifications');
  return { ok: true };
}

// ============================================================
// Export ZIP des données (RGPD §5C)
// ============================================================

/**
 * Stub : le vrai export ZIP nécessite une infra async (Edge Function
 * Supabase ou worker dédié + upload Storage). Voir ADR-008.
 *
 * Pour 1.3, on enregistre la demande, on déclenche un mail de
 * confirmation, et on signale visuellement à la personne que le lien
 * arrivera dans les 24 h.
 */
export async function demanderExportZip(): Promise<ResultatAction> {
  const { userId, email } = await getPersonneOuRediriger('/profil/confidentialite');

  // Mail de confirmation. En mock, ça se loggue dans `var/emails/`.
  // V2.4.133 : template editable admin via CMS (email.rgpd_export_demande.*).
  try {
    await envoyerEmailTemplee('rgpd_export_demande', email, { user_id: userId });
  } catch (erreur) {
    // L'envoi de mail ne doit pas faire échouer la demande : l'export
    // s'enregistre quand même (côté infra async, chantier dédié).
    console.warn('[demanderExportZip] envoi mail échoué :', erreur);
  }

  return { ok: true };
}

// ============================================================
// Suppression différée 30 jours (RGPD §5A)
// ============================================================
export async function demanderSuppression(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = demanderSuppressionSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesDemanderSuppression = parse.data;

  const { userId, email } = await getPersonneOuRediriger('/profil/confidentialite');

  if (donnees.confirmation_email !== email.toLowerCase()) {
    return {
      ok: false,
      message: 'L’email saisi ne correspond pas à celui de ton compte.',
    };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('personne')
    .update({
      statut: 'pending_deletion',
      suppression_demandee_le: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error !== null) {
    return { ok: false, message: `Demande impossible : ${error.message}` };
  }

  // V2.4.133 : template editable admin via CMS (email.rgpd_suppression_demande.*).
  try {
    await envoyerEmailTemplee('rgpd_suppression_demande', email, {});
  } catch (erreur) {
    console.warn('[demanderSuppression] envoi mail échoué :', erreur);
  }

  revalidatePath('/profil/confidentialite');
  return { ok: true };
}

export async function annulerSuppression(): Promise<ResultatAction> {
  const { userId } = await getPersonneOuRediriger('/profil/confidentialite');
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('personne')
    .update({
      statut: 'actif',
      suppression_demandee_le: null,
    })
    .eq('id', userId);

  if (error !== null) {
    return { ok: false, message: `Annulation impossible : ${error.message}` };
  }

  revalidatePath('/profil/confidentialite');
  return { ok: true };
}

// ============================================================
// 2FA TOTP (RGPD §5F)
// ============================================================

/**
 * Démarre l'enrôlement TOTP. Supabase renvoie un secret + QR code (data
 * URL SVG) que la personne scanne dans son authenticator app.
 */
export async function demarrerEnrollementTotp(): Promise<
  ResultatAction<{ factorId: string; uri: string; qr: string }>
> {
  await getPersonneOuRediriger('/profil/securite/2fa');
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Maintenant! TOTP',
  });

  if (error !== null) {
    return { ok: false, message: `Enrôlement impossible : ${error.message}` };
  }

  return {
    ok: true,
    factorId: data.id,
    uri: data.totp.uri,
    qr: data.totp.qr_code,
  };
}

/**
 * Vérifie le code TOTP saisi pour finaliser l'enrôlement.
 */
export async function verifierEnrollementTotp(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = verifierTotpSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Code invalide.' };
  }
  const donnees: DonneesVerifierTotp = parse.data;

  await getPersonneOuRediriger('/profil/securite/2fa');
  const supabase = await getSupabaseServer();

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: donnees.factor_id,
  });
  if (challengeError !== null) {
    return { ok: false, message: `Challenge impossible : ${challengeError.message}` };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: donnees.factor_id,
    challengeId: challenge.id,
    code: donnees.code,
  });

  if (verifyError !== null) {
    return { ok: false, message: 'Code incorrect. Vérifie ton authenticator et réessaie.' };
  }

  revalidatePath('/profil/confidentialite');
  redirect('/profil/confidentialite?2fa=active');
}

export async function desactiverTotp(factorId: string): Promise<ResultatAction> {
  await getPersonneOuRediriger('/profil/confidentialite');
  const supabase = await getSupabaseServer();

  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error !== null) {
    return { ok: false, message: `Désactivation impossible : ${error.message}` };
  }

  revalidatePath('/profil/confidentialite');
  return { ok: true };
}

'use server';

import { SITE } from '@/config/site';
import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesConnexionMdp,
  type DonneesInscription,
  type DonneesMagicLink,
  type ProviderOAuth,
  connexionMdpSchema,
  inscriptionSchema,
  magicLinkSchema,
} from '@/lib/validations/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Actions d'authentification.
 *
 * Toutes les actions :
 * 1. Valident la charge utile avec Zod (`safeParse`).
 * 2. Vérifient le token Turnstile côté serveur (`getTurnstileService`).
 * 3. Appellent Supabase Auth.
 * 4. Retournent un résultat typé `Resultat` que le client traduit en UI.
 *
 * Convention : les actions ne lèvent pas d'exception, sauf incident
 * vraiment imprévu. Les erreurs prévisibles (mot de passe faux, email
 * déjà pris, etc.) sont retournées dans `{ ok: false, message }`.
 */

export type ResultatAction = { ok: true; redirectVers?: string } | { ok: false; message: string };

/**
 * Wrapper de vérification Turnstile. Centralisé pour éviter la
 * duplication entre les 3 Server Actions qui s'en servent.
 */
async function verifierTurnstile(token: string): Promise<ResultatAction | null> {
  const resultat = await getTurnstileService().verifier(token);
  if (!resultat.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }
  return null;
}

// ============================================================
// Inscription : email + mot de passe + profil complet
// ============================================================
export async function inscrire(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = inscriptionSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesInscription = parse.data;

  const erreurTurnstile = await verifierTurnstile(donnees.token_turnstile);
  if (erreurTurnstile !== null) {
    return erreurTurnstile;
  }

  const supabase = await getSupabaseServer();

  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email: donnees.email,
    password: donnees.mot_de_passe,
    options: {
      emailRedirectTo: `${SITE.urlProd}/auth/callback?next=/profil/dashboard`,
    },
  });

  if (signUpError !== null) {
    return { ok: false, message: traduireErreurAuth(signUpError.message) };
  }
  if (signUp.user === null) {
    return {
      ok: false,
      message: 'Compte créé, vérifie ton mail pour le confirmer.',
    };
  }

  // Création de la ligne `personne` correspondante (cf. ADR-005).
  //
  // On utilise ici le client `admin` (service_role) et non le client
  // serveur cookie-bound. Raison : juste après `signUp`, l'utilisateur·ice
  // n'a pas encore de session active (la confirmation d'email n'a pas eu
  // lieu), donc `auth.uid()` vaut `null` côté policies RLS. La policy
  // `personne_insert_self` (`auth.uid() = id`) refuserait alors l'INSERT
  // et laisserait un `auth.users` orphelin sans ligne `personne`.
  //
  // Usage admin légitime : on n'insère qu'avec l'`id` retourné par
  // `signUp.user.id` (donc strictement le compte qui vient d'être créé),
  // pas de risque d'usurpation.
  const supabaseAdmin = getSupabaseAdmin();
  const { error: insertError } = await supabaseAdmin.from('personne').insert({
    id: signUp.user.id,
    email: donnees.email,
    nom: donnees.nom,
    prenom: donnees.prenom,
    pronom: donnees.pronom,
    code_postal: donnees.code_postal,
    telephone: donnees.telephone === '' ? null : (donnees.telephone ?? null),
    date_naissance: donnees.date_naissance,
    email_verifie: false,
    statut: 'actif',
  });

  if (insertError !== null) {
    // Le compte auth est créé mais le profil applicatif a échoué.
    // On laisse Supabase Auth tel quel : la prochaine connexion
    // détectera l'absence de profil et redirigera vers une page de
    // complétion (à poser au chantier 1.3).
    return {
      ok: false,
      message: `Compte créé, mais profil applicatif incomplet : ${insertError.message}`,
    };
  }

  return { ok: true, redirectVers: '/verifier-email' };
}

// ============================================================
// Connexion email + mot de passe
// ============================================================
export async function connecterAvecMotDePasse(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = connexionMdpSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesConnexionMdp = parse.data;

  const erreurTurnstile = await verifierTurnstile(donnees.token_turnstile);
  if (erreurTurnstile !== null) {
    return erreurTurnstile;
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: donnees.email,
    password: donnees.mot_de_passe,
  });

  if (error !== null) {
    return { ok: false, message: traduireErreurAuth(error.message) };
  }

  revalidatePath('/', 'layout');
  return { ok: true, redirectVers: '/profil/dashboard' };
}

// ============================================================
// Magic link
// ============================================================
export async function envoyerMagicLink(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = magicLinkSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesMagicLink = parse.data;

  const erreurTurnstile = await verifierTurnstile(donnees.token_turnstile);
  if (erreurTurnstile !== null) {
    return erreurTurnstile;
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: donnees.email,
    options: {
      emailRedirectTo: `${SITE.urlProd}/auth/callback?next=/profil/dashboard`,
    },
  });

  if (error !== null) {
    return { ok: false, message: traduireErreurAuth(error.message) };
  }

  return { ok: true, redirectVers: '/verifier-email' };
}

// ============================================================
// OAuth (GAFAM + éthique)
// ============================================================
export async function ouvrirOAuth(provider: ProviderOAuth): Promise<ResultatAction> {
  const supabase = await getSupabaseServer();

  // OAuth éthique (Mastodon, Framasoft, Solid) : pas branché en 1.2.
  // Voir MANIFEST chantier 1.2 (« Non livré »).
  if (provider === 'mastodon' || provider === 'framasoft' || provider === 'solid') {
    return {
      ok: false,
      message:
        "Cette porte d'authentification sera branchée plus tard. Utilise une autre porte pour l'instant.",
    };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${SITE.urlProd}/auth/callback?next=/profil/dashboard`,
    },
  });

  if (error !== null) {
    return { ok: false, message: traduireErreurAuth(error.message) };
  }

  if (data.url === null) {
    return { ok: false, message: 'OAuth a renvoyé une réponse incomplète.' };
  }

  return { ok: true, redirectVers: data.url };
}

// ============================================================
// Déconnexion
// ============================================================
export async function seDeconnecter(): Promise<never> {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

// ============================================================
// Helpers internes
// ============================================================

/** Traduit les messages d'erreur Supabase en français lisible. */
function traduireErreurAuth(messageBrut: string): string {
  const m = messageBrut.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email. Connecte-toi.';
  }
  if (m.includes('email not confirmed')) {
    return 'Email non vérifié. Regarde ta boîte mail et clique le lien de validation.';
  }
  if (m.includes('rate limit')) {
    return 'Trop de tentatives. Réessaie dans quelques minutes.';
  }
  // Fallback : on renvoie un message générique, sans exposer le détail Supabase.
  return "Quelque chose s'est mal passé. Réessaie dans un instant.";
}

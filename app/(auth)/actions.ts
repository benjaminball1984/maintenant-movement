'use server';

import { getSiteUrl } from '@/config/site';
import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesConnexionMdp,
  type DonneesDemandeReset,
  type DonneesInscription,
  type DonneesMagicLink,
  type DonneesNouveauMotDePasse,
  type ProviderOAuth,
  connexionMdpSchema,
  demandeResetSchema,
  inscriptionSchema,
  magicLinkSchema,
  nouveauMotDePasseSchema,
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

export type ResultatAction =
  | { ok: true; redirectVers?: string }
  | { ok: false; message: string; dejaInscrit?: boolean };

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

  // Création du compte via l'API admin (et non `auth.signUp` anonyme).
  //
  // Pourquoi admin (cf. ADR-006) : ce projet Supabase applique une
  // obfuscation anti-énumération stricte sur `signUp`, qui renvoie
  // toujours `user: null`, même en cas de succès (vérifié en conditions
  // réelles, chantier 13.1). Impossible d'en tirer l'`id` nécessaire à la
  // création de la ligne `personne`, ni de distinguer un compte neuf d'un
  // compte existant. L'API admin, elle, renvoie l'`id` de façon fiable et
  // signale un email déjà pris via `code: email_exists`.
  //
  // On ne perd pas de garde-fou : l'anti-bot est déjà assuré en amont par
  // Turnstile, et la robustesse du mot de passe par le schéma Zod.
  const supabaseAdmin = getSupabaseAdmin();
  const { data: creation, error: creationError } = await supabaseAdmin.auth.admin.createUser({
    email: donnees.email,
    password: donnees.mot_de_passe,
    // La personne doit valider son email avant d'être confirmée (RGPD §5E).
    email_confirm: false,
  });

  if (creationError !== null) {
    // Email déjà enregistré : on oriente vers connexion / réinitialisation
    // plutôt que de laisser un message d'erreur opaque.
    if (
      creationError.code === 'email_exists' ||
      creationError.message.toLowerCase().includes('already been registered')
    ) {
      return {
        ok: false,
        dejaInscrit: true,
        message:
          "Un compte existe déjà avec cet email. Tu peux te connecter, ou réinitialiser ton mot de passe si tu l'as oublié.",
      };
    }
    return { ok: false, message: traduireErreurAuth(creationError.message) };
  }

  const utilisateurAuth = creation.user;

  // Envoi de l'email de confirmation. `createUser` ne déclenche aucun
  // email : on le demande explicitement via `resend`. Si l'envoi échoue,
  // on supprime le compte tout juste créé pour ne pas laisser un compte
  // orphelin que la personne ne pourrait jamais valider : l'inscription
  // reste ainsi « tout ou rien ».
  const supabase = await getSupabaseServer();
  const { error: emailError } = await supabase.auth.resend({
    type: 'signup',
    email: donnees.email,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/profil/dashboard`,
    },
  });

  if (emailError !== null) {
    await supabaseAdmin.auth.admin.deleteUser(utilisateurAuth.id);
    return {
      ok: false,
      message: "L'email de confirmation n'a pas pu être envoyé. Réessaie dans un instant.",
    };
  }

  // Création de la ligne `personne` correspondante (cf. ADR-005), via le
  // client admin (service_role). Raison : juste après la création,
  // l'utilisateur·ice n'a pas de session (email pas confirmé), donc
  // `auth.uid()` vaut `null` côté policies RLS et la policy
  // `personne_insert_self` (`auth.uid() = id`) refuserait l'INSERT.
  //
  // Usage admin légitime : on n'insère qu'avec l'`id` du compte qui vient
  // d'être créé (`creation.user.id`), pas de risque d'usurpation.
  const { error: insertError } = await supabaseAdmin.from('personne').insert({
    id: utilisateurAuth.id,
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
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/profil/dashboard`,
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
      redirectTo: `${getSiteUrl()}/auth/callback?next=/profil/dashboard`,
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
// Reset du mot de passe (demande + nouveau mot de passe)
// ============================================================

/**
 * Etape 1 : envoie un mail avec un lien de reinitialisation.
 *
 * Le lien clique amene sur `/auth/callback?next=/reinitialiser-mot-de-passe`,
 * ce qui ouvre une session temporaire puis renvoie sur le formulaire de
 * nouveau mot de passe.
 *
 * Pour l'anti-enumeration : on retourne `ok: true` quel que soit le
 * resultat de Supabase (succes ou email inexistant), pour ne pas laisser
 * deduire si un email est enregistre ou non. C'est aussi le comportement
 * par defaut de Supabase qui ne distingue pas ces deux cas dans l'API.
 */
export async function demanderResetMotDePasse(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = demandeResetSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Donnees invalides.' };
  }
  const donnees: DonneesDemandeReset = parse.data;

  const erreurTurnstile = await verifierTurnstile(donnees.token_turnstile);
  if (erreurTurnstile !== null) {
    return erreurTurnstile;
  }

  const supabase = await getSupabaseServer();
  await supabase.auth.resetPasswordForEmail(donnees.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });

  // On ne propage pas l'erreur eventuelle (anti-enumeration).
  return { ok: true, redirectVers: '/verifier-email' };
}

/**
 * Etape 2 : applique le nouveau mot de passe.
 *
 * Pre-requis : la personne arrive ici apres avoir clique sur le lien
 * email, donc une session temporaire est posee par le callback. Si la
 * session est absente, on rejette : c'est probablement quelqu'un qui a
 * navigue directement sur la page.
 */
export async function definirNouveauMotDePasse(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = nouveauMotDePasseSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Donnees invalides.' };
  }
  const donnees: DonneesNouveauMotDePasse = parse.data;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    return {
      ok: false,
      message:
        'Lien expire ou invalide. Refais une demande de reinitialisation depuis la page Mot de passe oublie.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password: donnees.mot_de_passe });
  if (error !== null) {
    return { ok: false, message: traduireErreurAuth(error.message) };
  }

  revalidatePath('/', 'layout');
  return { ok: true, redirectVers: '/profil/dashboard' };
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

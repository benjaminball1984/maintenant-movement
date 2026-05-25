import { getSupabaseServer } from '@/lib/supabase';
import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Handler de retour d'authentification.
 *
 * Deux formats de lien aboutissent ici, et on les gère tous les deux :
 *
 *  1. Liens d'email (confirmation d'inscription, lien magique,
 *     réinitialisation de mot de passe) : `?token_hash=...&type=...`.
 *     On vérifie le jeton via `verifyOtp`, qui pose la session côté serveur
 *     (cookies). C'est le format recommandé par Supabase pour le rendu
 *     côté serveur : il ne dépend ni d'un fragment d'URL (`#...`, illisible
 *     côté serveur), ni d'un cookie `code_verifier` (fragile entre
 *     appareils). Le lien pointe directement sur cette route, sans repasser
 *     par l'endpoint `/auth/v1/verify` de Supabase.
 *
 *  2. Retour OAuth (flux PKCE) : `?code=...`. On échange le code contre une
 *     session via `exchangeCodeForSession`.
 *
 * `next` indique où atterrir après succès (défaut : le tableau de bord).
 *
 * Erreurs : jeton/code absent ou vérification échouée -> redirection vers
 * `/connexion?erreur=...`, qui affiche un message lisible.
 *
 * Documentation Supabase :
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
/**
 * Rattache le compte tout juste authentifié à son profil unifié (numéro M+7,
 * chantier 13.3-E) et rend ses anciennes signatures lisibles dans « Mes
 * contributions ». L'email vient d'être vérifié (verifyOtp / OAuth), donc le
 * rattachement par email est légitime.
 *
 * Idempotente et best-effort : un échec (migration 038 pas encore appliquée)
 * ne doit jamais empêcher la connexion d'aboutir.
 */
async function rattacherProfilUnifieSilencieux(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
): Promise<void> {
  try {
    const { error } = await supabase.rpc('rattacher_profil_unifie');
    if (error !== null) {
      console.warn('[auth/callback] rattachement profil unifié ignoré :', error.message);
    }
  } catch (erreur) {
    console.warn('[auth/callback] rattachement profil unifié ignoré :', erreur);
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next') ?? '/profil/dashboard';

  const supabase = await getSupabaseServer();

  // Cas 1 : lien d'email (confirmation, lien magique, recovery).
  if (tokenHash !== null && type !== null) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error !== null) {
      return NextResponse.redirect(
        new URL(`/connexion?erreur=${encodeURIComponent(error.message)}`, url.origin),
      );
    }
    await rattacherProfilUnifieSilencieux(supabase);
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // Cas 2 : retour OAuth (PKCE).
  if (code !== null) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error !== null) {
      return NextResponse.redirect(
        new URL(`/connexion?erreur=${encodeURIComponent(error.message)}`, url.origin),
      );
    }
    await rattacherProfilUnifieSilencieux(supabase);
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // Ni jeton d'email ni code OAuth : lien incomplet ou expiré.
  return NextResponse.redirect(new URL('/connexion?erreur=code-manquant', url.origin));
}

import { getSupabaseServer } from '@/lib/supabase';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Handler du retour OAuth / magic link.
 *
 * Supabase Auth redirige vers cette route avec un paramètre `code` à
 * échanger contre une session, et optionnellement un paramètre `next`
 * indiquant où atterrir après la connexion réussie.
 *
 * Erreurs possibles :
 *   - `code` absent ou invalide : redirection vers `/connexion?erreur=...`
 *   - échec d'échange de session : redirection vers `/connexion?erreur=...`
 *
 * Documentation Supabase :
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/profil/dashboard';

  if (code === null) {
    return NextResponse.redirect(new URL('/connexion?erreur=code-manquant', url.origin));
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error !== null) {
    return NextResponse.redirect(
      new URL(`/connexion?erreur=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

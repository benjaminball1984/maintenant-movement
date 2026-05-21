import { getSupabaseServer } from '@/lib/supabase';
import type { Personne } from '@/types/database';
import { redirect } from 'next/navigation';

/**
 * Helpers de session côté serveur.
 *
 * À utiliser dans tout layout ou page protégée pour récupérer la personne
 * connectée. Centralise le pattern « si pas auth → redirige vers /connexion
 * avec `?prochaine=` pour ramener à la bonne page après login ».
 */

export interface ContexteSession {
  userId: string;
  email: string;
  personne: Personne | null;
}

/**
 * Récupère la session courante. Retourne `null` si la personne n'est pas
 * connectée. Ne fait pas de redirect : utile pour les pages qui veulent
 * adapter leur rendu (afficher un bouton « connexion » par exemple).
 */
export async function getSession(): Promise<ContexteSession | null> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return null;
  }

  // La ligne `personne` peut être absente brièvement entre auth.signUp et
  // l'insert applicatif (cf. flux d'inscription chantier 1.2). On
  // retourne null dans ce cas, l'appelant·e décide quoi faire.
  const { data: personne } = await supabase
    .from('personne')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? '',
    personne: (personne ?? null) as Personne | null,
  };
}

/**
 * Comme `getSession`, mais redirige vers `/connexion?prochaine=<chemin>`
 * si la personne n'est pas connectée. Toutes les pages `/profil/*`
 * passent par ce helper.
 *
 * `cheminCourant` permet de mémoriser où la personne voulait aller pour
 * qu'on la redirige correctement après login.
 */
export async function getSessionOuRediriger(cheminCourant: string): Promise<ContexteSession> {
  const session = await getSession();
  if (session === null) {
    redirect(`/connexion?prochaine=${encodeURIComponent(cheminCourant)}`);
  }
  return session;
}

/**
 * Comme `getSessionOuRediriger`, mais exige aussi que la ligne `personne`
 * existe. Si elle est absente (cas rare post-signup), redirige vers une
 * page de complétion du profil (à poser au chantier qui en aura besoin).
 *
 * Pour 1.3, on traite l'absence en lançant une erreur explicite : c'est
 * un état pathologique qui ne doit pas arriver en production.
 */
export async function getPersonneOuRediriger(
  cheminCourant: string,
): Promise<ContexteSession & { personne: Personne }> {
  const session = await getSessionOuRediriger(cheminCourant);
  if (session.personne === null) {
    throw new Error(
      `Personne authentifiée (${session.userId}) sans ligne dans la table \`personne\`. Probable inscription incomplète (cf. flux Server Action inscrire).`,
    );
  }
  return { ...session, personne: session.personne };
}

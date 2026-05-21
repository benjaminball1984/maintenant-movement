import { getSupabaseServer } from '@/lib/supabase';

export interface CompteursHome {
  newsletter: number;
  membres: number;
  signataires: number;
}

/**
 * Compteurs du pré-footer de la page d'accueil (cf. spec §3).
 *
 * Pour le chantier 2.1, seul `membres` a une vraie valeur :
 *   - membres = count(personne where statut = 'actif')
 *
 * `newsletter` et `signataires` sont à 0 tant que les chantiers 8.1
 * (newsletter Brevo) et 3.1 (pétitions et signatures) ne sont pas
 * branchés. On ne ment pas : 0 et c'est documenté en UI.
 *
 * Tolérance d'erreur : si Supabase est inaccessible (clés manquantes
 * en dev par exemple), on retourne 0 partout plutôt que de crasher la
 * home, parce que la home doit rester accessible.
 */
export async function getCompteursHome(): Promise<CompteursHome> {
  try {
    const supabase = await getSupabaseServer();
    const { count } = await supabase
      .from('personne')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'actif');

    return {
      newsletter: 0,
      membres: count ?? 0,
      signataires: 0,
    };
  } catch (_erreur) {
    // En dev sans Supabase ou si la table n'a pas encore été migrée,
    // on dégrade proprement plutôt que de casser la home.
    return { newsletter: 0, membres: 0, signataires: 0 };
  }
}

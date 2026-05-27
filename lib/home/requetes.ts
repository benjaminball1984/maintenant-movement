import { getSupabaseServer } from '@/lib/supabase';

export interface CompteursHome {
  newsletter: number;
  membres: number;
  signataires: number;
}

/**
 * Compteurs du pré-footer de la page d'accueil (cf. spec §3).
 *
 * - membres = count(personne where statut = 'actif')
 * - signataires = count(signature_petition) total (incluant les 17 746
 *   importés depuis Base44 V1, déjà en base depuis le chantier 10.1)
 * - newsletter = count(signature_petition where accepte_newsletter = true)
 *   Le champ `accepte_newsletter` est rempli à la signature : signe
 *   d'opt-in pour être contacté·e par la plateforme. C'est la base de
 *   l'envoi de la newsletter (V1 et import Base44 inclus).
 *
 * Note : `accepte_contact_createurice` (autre opt-in, pour que la
 * créatrice de la pétition puisse exporter un CSV de ses signataires
 * qui l'autorisent) n'est pas exposé ici car ce n'est pas un indicateur
 * public — il sert à l'export CSV côté admin pétition.
 *
 * Tolérance d'erreur : si Supabase est inaccessible (clés manquantes
 * en dev par exemple), on retourne 0 partout plutôt que de crasher la
 * home, parce que la home doit rester accessible.
 */
export async function getCompteursHome(): Promise<CompteursHome> {
  try {
    const supabase = await getSupabaseServer();
    const [membresRes, signataresRes, newsletterRes] = await Promise.all([
      supabase.from('personne').select('id', { count: 'exact', head: true }).eq('statut', 'actif'),
      supabase.from('signature_petition').select('id', { count: 'exact', head: true }),
      supabase
        .from('signature_petition')
        .select('id', { count: 'exact', head: true })
        .eq('accepte_newsletter', true),
    ]);

    return {
      newsletter: newsletterRes.count ?? 0,
      membres: membresRes.count ?? 0,
      signataires: signataresRes.count ?? 0,
    };
  } catch (_erreur) {
    // En dev sans Supabase ou si la table n'a pas encore été migrée,
    // on dégrade proprement plutôt que de casser la home.
    return { newsletter: 0, membres: 0, signataires: 0 };
  }
}

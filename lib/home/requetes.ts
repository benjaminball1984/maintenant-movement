import { getSupabaseAdmin } from '@/lib/supabase/admin';

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
 * Important : on utilise le client admin (service_role) car les compteurs
 * sont affichés à TOUS LES VISITEURS, y compris anonymes. La RLS de
 * `personne` bloque les lectures anonymes (PII). En passant par
 * service_role, on contourne la RLS mais on n'expose qu'un COUNT
 * agrégé (aucune ligne individuelle), ce qui est acceptable RGPD :
 * les chiffres globaux d'un mouvement politique sont publics par
 * nature.
 *
 * Tolérance d'erreur : si Supabase est inaccessible, on retourne 0
 * partout plutôt que de crasher la home.
 */
export async function getCompteursHome(): Promise<CompteursHome> {
  try {
    const supabase = getSupabaseAdmin();
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
    return { newsletter: 0, membres: 0, signataires: 0 };
  }
}

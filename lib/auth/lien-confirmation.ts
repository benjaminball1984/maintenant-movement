import { getSiteUrl } from '@/config/site';
import { cheminInterneOuDefaut } from '@/lib/auth/chemin-retour';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Fabrication du lien de confirmation, SANS envoyer d'email (V2.6.144).
 *
 * C'est ce qui nous permet d'écrire nous-mêmes le message reçu par les
 * nouvelles inscrites (demande Ben du 08/09/2026 : le « Confirm your
 * signup » de Supabase était trop sec, et surtout il ne disait rien du
 * geste qui venait d'être fait). Supabase ne poste plus rien : il fournit
 * l'adresse du lien, nos gabarits (`lib/email-templates`) écrivent autour.
 *
 * Partagé par les trois portes qui créent un compte : inscription
 * classique, adhésion sans compte, vote sans compte.
 */

/**
 * Lien de confirmation d'une inscription dont on connaît le mot de passe
 * (il vient d'être posé, à la main ou tiré au hasard).
 *
 * Best-effort : `null` en cas d'échec. L'email part alors sans lien plutôt
 * que pas du tout, et la personne garde la porte « mot de passe oublié ».
 */
export async function lienConfirmationInscription(
  email: string,
  motDePasse: string,
  retourApres: string,
): Promise<string | null> {
  return genererLien({
    type: 'signup',
    email,
    password: motDePasse,
    options: { redirectTo: urlDeRetour(retourApres) },
  });
}

/**
 * Lien de connexion à usage unique, pour les cas où le mot de passe n'est
 * PAS connu : typiquement le renvoi du mail de vérification, demandé
 * depuis la page de connexion.
 *
 * Le suivre vaut vérification de l'adresse : c'est le même effet que le
 * lien d'inscription, par un autre chemin.
 */
export async function lienConnexionUsageUnique(
  email: string,
  retourApres: string,
): Promise<string | null> {
  return genererLien({
    type: 'magiclink',
    email,
    options: { redirectTo: urlDeRetour(retourApres) },
  });
}

/** Appel commun à `generateLink`, avec la même dégradation propre. */
async function genererLien(
  parametres: Parameters<ReturnType<typeof getSupabaseAdmin>['auth']['admin']['generateLink']>[0],
): Promise<string | null> {
  try {
    const { data, error } = await getSupabaseAdmin().auth.admin.generateLink(parametres);
    if (error !== null) {
      console.warn('[lien-confirmation] lien indisponible :', error.message);
      return null;
    }
    return data.properties?.action_link ?? null;
  } catch (erreur) {
    console.warn('[lien-confirmation] lien indisponible :', erreur);
    return null;
  }
}

/**
 * URL où atterrit la personne après le clic.
 *
 * Le chemin est forcé INTERNE par `cheminInterneOuDefaut` : sans ça, un
 * `next` fabriqué transformerait un lien de confirmation légitime en
 * redirection ouverte, donc en hameçonnage (revue sécurité S1).
 */
function urlDeRetour(retourApres: string): string {
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(cheminInterneOuDefaut(retourApres))}`;
}

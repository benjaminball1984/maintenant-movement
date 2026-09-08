/**
 * Le chemin où ramener quelqu'un après une connexion (V2.6.143).
 *
 * Le site sème des liens `?prochaine=/la/page` depuis une quinzaine
 * d'endroits (`getSessionOuRediriger`, boutons « se connecter pour… »).
 * L'intention était là depuis le début ; **la lecture, elle, n'existait
 * pas** : les Server Actions de connexion renvoyaient toutes vers
 * `/profil/dashboard`, quelle que soit la page d'origine. Constaté le
 * 08/09/2026 en branchant le vote aux sondages, sur cette demande de
 * Lilou/Ben : « une fois connectée, la personne retourne automatiquement
 * sur ce qu'elle était en train de faire ».
 *
 * Ce module est la seule porte d'entrée de ce paramètre, pour que le
 * garde-fou anti-redirection ouverte ne soit écrit qu'une fois.
 */

/** Où atterrit une personne connectée quand rien n'est précisé. */
export const CHEMIN_APRES_CONNEXION_DEFAUT = '/profil/dashboard';

/**
 * Valide un chemin de retour et retombe sur le tableau de bord s'il est
 * absent ou suspect.
 *
 * N'accepte QU'UN chemin interne commençant par un seul « / ». Sans ce
 * filtre, `?prochaine=//evil.com` ou `?prochaine=https://evil.com`
 * transformerait la page de connexion du mouvement en tremplin
 * d'hameçonnage : on se connecte chez nous, on atterrit chez eux (même
 * garde-fou que `app/auth/callback`, revue sécurité S1).
 */
export function cheminInterneOuDefaut(chemin: string | null | undefined): string {
  if (typeof chemin !== 'string' || chemin === '') {
    return CHEMIN_APRES_CONNEXION_DEFAUT;
  }
  const suspect = !chemin.startsWith('/') || chemin.startsWith('//') || chemin.startsWith('/\\');
  return suspect ? CHEMIN_APRES_CONNEXION_DEFAUT : chemin;
}

/**
 * Helpers d'affichage du réseau social, SANS dépendance serveur (pas de
 * `next/headers` ni de client Supabase). Ce module peut donc être importé aussi
 * bien par des Server Components que par des Client Components.
 */

/**
 * Nom affiché à partir de prénom/nom (chacun pouvant être masqué selon la
 * visibilité). On préfère « Prénom Nom », sinon le morceau visible, sinon
 * « Membre » (jamais de blanc).
 */
export function nomAffiche(prenom: string | null, nom: string | null): string {
  const morceaux = [prenom, nom].filter((m): m is string => m !== null && m.trim() !== '');
  return morceaux.length > 0 ? morceaux.join(' ') : 'Membre';
}

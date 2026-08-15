import { redirect } from 'next/navigation';

/**
 * `/profil` redirige vers `/profil/informations`, entrée par défaut de
 * l'espace membre depuis la réduction des onglets du 01/08/2026 (l'ancien
 * tableau de bord agrégeait des rubriques aujourd'hui en sommeil).
 *
 * Si la personne n'est pas connectée, `layout.tsx` redirigera vers
 * `/connexion?prochaine=/profil/informations` via le helper de session.
 */
export default function PageProfilRacine() {
  redirect('/profil/informations');
}

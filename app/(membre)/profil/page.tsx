import { redirect } from 'next/navigation';

/**
 * `/profil` redirige vers `/profil/dashboard` qui est l'entrée par défaut.
 * Si la personne n'est pas connectée, `layout.tsx` redirigera vers
 * `/connexion?prochaine=/profil/dashboard` via le helper de session.
 */
export default function PageProfilRacine() {
  redirect('/profil/dashboard');
}

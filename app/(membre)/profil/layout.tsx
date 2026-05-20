import { SITE } from '@/config/site';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BoutonDeconnexion } from './BoutonDeconnexion';
import { NavOnglets } from './NavOnglets';

/**
 * Layout du profil utilisateurice.
 *
 * Note : les pages enfants doivent appeler `getPersonneOuRediriger()`
 * elles-mêmes pour récupérer la session. Le layout ne peut pas passer
 * les data aux enfants (limite App Router) et faire deux appels (layout
 * + page) n'a pas de surcoût grâce au cache de session Supabase.
 *
 * Le layout sert ici à poser la structure visuelle commune :
 * - header sobre avec lien retour `/` et bouton déconnexion
 * - barre de navigation 7 onglets (`NavOnglets`)
 * - main centré
 */
export default function LayoutProfil({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-bold text-text-1 hover:text-brand">
            {SITE.nom}
          </Link>
          <BoutonDeconnexion />
        </div>
      </header>

      <NavOnglets />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

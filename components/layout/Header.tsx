import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ESPACES } from '@/config/espaces';
import { SITE } from '@/config/site';
import { getSession } from '@/lib/auth/session';
import Link from 'next/link';
import { HeaderProfilMenu } from './HeaderProfilMenu';

/**
 * Header du site (chantier 2.1).
 *
 * Structure (cf. 01_ARCHITECTURE.md §3) :
 *   - Logo Maintenant! à gauche, lien vers `/`.
 *   - Nav des 5 espaces au centre (épicène, depuis `config/espaces.ts`).
 *   - Bouton profil / connexion à droite.
 *     - Connecté·e : prénom + menu déroulant (profil, déconnexion).
 *     - Déconnecté·e : liens Se connecter + Créer un compte.
 *
 * Server Component (lit la session côté serveur). Le menu déroulant est
 * isolé en Client Component (`HeaderProfilMenu`).
 *
 * Visibilité « presque tout visible » (cf. spec §3) : aucune nav cachée
 * derrière l'auth, seul le menu profil change.
 */
export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-text-1 hover:text-brand"
        >
          {SITE.nom}
        </Link>

        <nav aria-label="Espaces principaux" className="hidden flex-1 items-center md:flex">
          <ul className="flex gap-1">
            {ESPACES.map((espace) => (
              <li key={espace.slug}>
                <Link
                  href={`/${espace.slug}`}
                  className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-text-2 transition-colors duration-fast hover:bg-surface-2 hover:text-text-1"
                >
                  {espace.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {session !== null ? (
            <HeaderProfilMenu email={session.email} prenom={session.personne?.prenom ?? null} />
          ) : (
            <>
              <Link
                href="/connexion"
                className="hidden h-10 items-center rounded-md px-3 text-sm font-medium text-text-2 hover:text-text-1 sm:inline-flex"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="inline-flex h-10 items-center rounded-md bg-grad px-4 text-sm font-bold text-white shadow-brand transition hover:brightness-110"
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Nav mobile : tiroir simple horizontal scrollable. */}
      <nav
        aria-label="Espaces principaux (mobile)"
        className="overflow-x-auto border-t border-border bg-surface md:hidden"
      >
        <ul className="mx-auto flex max-w-7xl gap-1 px-4 py-2">
          {ESPACES.map((espace) => (
            <li key={espace.slug}>
              <Link
                href={`/${espace.slug}`}
                className="inline-flex h-9 items-center rounded-md px-3 text-sm text-text-2"
              >
                {espace.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

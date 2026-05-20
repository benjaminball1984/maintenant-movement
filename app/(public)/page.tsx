import Link from 'next/link';

/**
 * Page d'accueil temporaire — chantier 0.1.
 *
 * Affiche les éléments de titre fixés par la spec (01_ARCHITECTURE.md §3) :
 * surtitre, titre, sous-titre. La structure complète (header, 4 unes,
 * pré-footer, footer) sera implémentée au chantier 2.1.
 *
 * Aucun lien ne pointe vers une page inexistante (cf. CLAUDE.md §4). Seul
 * le lien vers `/design-system` est exposé, et la page existe (placeholder
 * annonçant le chantier 0.2).
 */
export default function PageAccueil() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-neutral-600">
          La plateforme citoyenne des 99 %
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-neutral-900">Maintenant!</h1>
        <p className="text-lg text-neutral-700">
          Pour une vie digne et heureuse pour tous et toutes, dans un monde vivable. Face aux
          oppressions systémiques, nos luttes doivent devenir systémiques.
        </p>
      </header>

      <section
        aria-label="État du site"
        className="rounded border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
      >
        <p>
          Site en construction. Chantier 0.1 (initialisation du dépôt) terminé. La page d'accueil
          définitive est prévue au chantier 2.1.
        </p>
      </section>

      <nav aria-label="Navigation interne">
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href="/design-system"
              className="text-neutral-900 underline underline-offset-4 hover:no-underline"
            >
              Système de design (chantier 0.2)
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}

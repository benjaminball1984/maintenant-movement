import { Alert, Container, Heading } from '@/components/ui';
import Link from 'next/link';

/**
 * Page d'accueil temporaire.
 *
 * Affiche les éléments de titre fixés par la spec (`01_ARCHITECTURE.md §3`) :
 * surtitre, titre, sous-titre. La structure complète (header, 4 unes
 * empilées, pré-footer, footer) sera implémentée au chantier 2.1.
 *
 * Aucun lien ne pointe vers une page inexistante (cf. CLAUDE.md §4) :
 * seuls `/design-system` (placeholder 0.2 désormais peuplé) est exposé.
 */
export default function PageAccueil() {
  return (
    <Container taille="md" className="flex min-h-screen flex-col justify-center gap-8 py-16">
      <header className="flex flex-col gap-3">
        <p className="font-body text-sm font-bold uppercase tracking-cap text-text-3">
          La plateforme citoyenne des 99 %
        </p>
        <Heading niveau={1}>Maintenant!</Heading>
        <p className="text-lg text-text-2">
          Pour une vie digne et heureuse pour tous et toutes, dans un monde vivable. Face aux
          oppressions systémiques, nos luttes doivent devenir systémiques.
        </p>
      </header>

      <Alert variant="info" titre="Site en construction">
        Chantier 0.2 (système de design) en cours. La page d'accueil définitive est prévue au
        chantier 2.1.
      </Alert>

      <nav aria-label="Navigation interne">
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href="/design-system"
              className="text-brand underline-offset-4 hover:no-underline"
            >
              Système de design (showcase)
            </Link>
          </li>
        </ul>
      </nav>
    </Container>
  );
}

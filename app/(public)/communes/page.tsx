import { CarteCommunesWrapper } from '@/components/communes/CarteCommunesWrapper';
import { Container, Heading } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte des communes',
  description:
    'Carte de toutes les communes et arrondissements. Clique sur une commune pour voir sa fiche : inscrit·es, signataires, abonné·es et membres.',
};

/**
 * Carte clusterisée du référentiel des communes (chantier 13.3-C).
 *
 * Distincte de la carte unifiée (chantier 6.1, tout le contenu géolocalisé) :
 * celle-ci porte uniquement le référentiel géographique complet (~35 000
 * communes + arrondissements) et sert de porte d'entrée vers les fiches.
 */
export default function PageCarteCommunes() {
  return (
    <Container className="py-8">
      <header className="mb-6">
        <Heading niveau={1}>Carte des communes</Heading>
        <p className="mt-2 max-w-2xl text-text-2">
          Toutes les communes et arrondissements. Zoome puis clique sur une commune pour ouvrir sa
          fiche : nombre d'inscrit·es, de signataires, d'abonné·es, et les membres qui l'ont
          rejointe.
        </p>
      </header>

      <CarteCommunesWrapper />

      <p className="mt-4 text-sm text-text-3">
        Les compteurs sont agrégés et anonymisés. Seuls les membres qui ont explicitement rejoint
        une commune y apparaissent nommément.
      </p>
    </Container>
  );
}

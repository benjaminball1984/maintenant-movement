import { CarteWrapper } from '@/components/carte/CarteWrapper';
import { Container, Heading } from '@/components/ui';
import { chargerPointsCarte } from '@/lib/carte/donnees';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte unifiée',
  description:
    'Carte interactive des actions Maintenant! : mobilisations, communes libres, et plus à venir.',
};

/**
 * Page `/carte` — carte unifiée transverse (chantier 3.2 v1).
 *
 * Cf. spec §8A : « bases de données séparées par espace, agrégation à
 * l'affichage ». Le Server Component charge les points (mobilisations
 * publiées + communes), le Client Component les rend avec MapLibre.
 *
 * Sources actuelles : mobilisations + communes. À enrichir au fil des
 * chantiers :
 *   - 3.3 cagnottes locales
 *   - 4.x moments solidaires
 *   - 6.x frigos / minimarchés / initiatives d'entraide
 *   - 7.5 sondages locaux
 */
export default async function PageCarte() {
  const points = await chargerPointsCarte();

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-6">
        <Heading niveau={1}>Carte des actions</Heading>
        <p className="mt-2 max-w-2xl text-text-2">
          Tout ce qui est géolocalisé sur Maintenant!, sur une seule carte. Coche / décoche les
          types pour filtrer. Plus de sources viendront avec les prochains chantiers.
        </p>
        <p className="mt-1 text-xs text-text-3">{points.length} points affichés.</p>
      </header>

      <CarteWrapper points={points} />
    </Container>
  );
}

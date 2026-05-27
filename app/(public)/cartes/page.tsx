import { Card, Container, Heading } from '@/components/ui';
import { Building, HandHelping, Map as IconeMap, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cartes',
  description: 'Index des cartes Maintenant! : évènements, communes, hébergements solidaires.',
};

const CARTES = [
  {
    href: '/carte',
    titre: 'Carte des activités',
    description:
      'Toutes les activités géolocalisées : mobilisations, entraide, SEL, marché, moments solidaires, sondages, groupes d’entraide.',
    icone: IconeMap,
  },
  {
    href: '/communes',
    titre: 'Carte des communes',
    description:
      '35 000+ communes pré-créées sur le référentiel INSEE. Clusterisation pour zoomer sur la France entière.',
    icone: Building,
  },
  {
    href: '/cartes/hebergements',
    titre: 'Hébergements solidaires',
    description:
      'Carte dédiée aux hébergements solidaires uniquement, pour qui cherche un toit ou veut en offrir un.',
    icone: HandHelping,
  },
] as const;

export default function PageIndexCartes() {
  return (
    <Container taille="lg" className="py-12">
      <Heading niveau={1}>
        <MapPin size={26} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Cartes
      </Heading>
      <p className="mt-2 text-text-2">Trois cartes thématiques selon ce que tu cherches.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARTES.map((c) => {
          const Icone = c.icone;
          return (
            <li key={c.href}>
              <Link href={c.href} className="block hover:opacity-90">
                <Card variant="ombre" className="grid h-full gap-2">
                  <Icone size={28} className="text-brand" aria-hidden="true" />
                  <h2 className="font-display font-bold text-lg text-text-1">{c.titre}</h2>
                  <p className="text-sm text-text-2">{c.description}</p>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}

import { Card, Container, Heading } from '@/components/ui';
import { trouverEspace } from '@/config/espaces';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Comprendre',
};

/**
 * Page racine de l'espace Comprendre. Contrairement aux 4 autres
 * espaces, on lie ici aux 4 sous-pages parce qu'elles existent
 * (en stub éditorial pour 2.1, complétion en 2.2).
 */
export default function PageComprendre() {
  const espace = trouverEspace('comprendre');
  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Espace</p>
        <Heading niveau={1} className="mt-1">
          Comprendre
        </Heading>
        <p className="mt-2 text-text-2">
          La pédagogie du mouvement : monnaie, doctrine, FAQ, ressources.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {espace.sousEspaces.map((sousEspace) => (
          <Link key={sousEspace.slug} href={`/comprendre/${sousEspace.slug}`} className="block">
            <Card variant="ombre" className="h-full hover:border-border-dark">
              <p className="font-bold text-text-1">{sousEspace.libelle}</p>
              <p className="mt-1 font-mono text-xs text-text-3">/comprendre/{sousEspace.slug}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}

import { Card, Container, Heading } from '@/components/ui';
import { listerConfederations } from '@/lib/communes/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Confédérations' };

export default async function PageConfederations() {
  const confederations = await listerConfederations();
  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
        <Heading niveau={1}>Confédérations</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Agrègent des fédérations, récursif au-delà. Source de l'
          <Link href="/agir/assemblee" className="underline">
            Assemblée Confédérale
          </Link>{' '}
          (binômes tirés au sort par entité).
        </p>
      </header>

      {confederations.length === 0 ? (
        <p className="text-sm text-text-3">Aucune confédération pour l'instant.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {confederations.map((c) => (
            <li key={c.id}>
              <Card variant="ombre" className="flex flex-col gap-2">
                <h3 className="text-lg font-bold leading-tight text-text-1">{c.nom}</h3>
                {c.description_courte !== null && c.description_courte.trim() !== '' ? (
                  <p className="text-sm text-text-2">{c.description_courte}</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

import { CarteCommune } from '@/components/communes/CarteCommune';
import { Alert, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerCommunes } from '@/lib/communes/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Communes libres',
  description:
    'Communes du mouvement Maintenant! — territoriales ou libres. On part du réel, on ne part pas de coquille vide.',
};

interface PageCommunesProps {
  searchParams: Promise<{ recherche?: string }>;
}

export default async function PageCommunes({ searchParams }: PageCommunesProps) {
  const { recherche } = await searchParams;
  const [communes, session] = await Promise.all([listerCommunes(recherche), getSession()]);
  const personneConnectee = session !== null;

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
          <Heading niveau={1}>Communes libres</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            On part du réel et on ne part pas de coquille vide. Maximum 3 communes par personne ;
            anti-spam une transition par mois.
          </p>
        </div>
        <Link
          href="/agir/communes/nouvelle"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {personneConnectee ? 'Créer une commune libre' : 'Connecte-toi pour créer'}
        </Link>
      </header>

      <form method="get" className="mb-8 flex gap-2">
        <input
          type="search"
          name="recherche"
          placeholder="Rechercher une commune par nom"
          defaultValue={recherche ?? ''}
          className="w-full rounded-sm border border-border bg-surface p-2 text-sm"
        />
      </form>

      {communes.length === 0 ? (
        <Alert variant="info" titre="Aucune commune trouvée">
          Élargis la recherche ou crée une commune libre.
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communes.map((c) => (
            <li key={c.id}>
              <CarteCommune commune={c} />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12 grid gap-2 rounded-md border border-border bg-surface-2 p-6 text-sm text-text-2">
        <Heading niveau={2} apparenceComme={4}>
          Trois niveaux supra-locaux
        </Heading>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <Link href="/agir/communes" className="underline">
              Communes
            </Link>{' '}
            (territoriales ou libres) ;
          </li>
          <li>
            <Link href="/agir/federations" className="underline">
              Fédérations
            </Link>{' '}
            (géographique, thématique, mixte) ;
          </li>
          <li>
            <Link href="/agir/confederations" className="underline">
              Confédérations
            </Link>{' '}
            ;
          </li>
          <li>
            <Link href="/agir/assemblee" className="underline">
              Assemblée Confédérale
            </Link>{' '}
            (binômes tirés au sort).
          </li>
        </ul>
      </section>
    </Container>
  );
}

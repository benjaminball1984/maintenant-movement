import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerSondagesOuverts } from '@/lib/sondages/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sondages',
  description: 'Sondages Maintenant! — vote connecté obligatoire, 2 modes (classique + pondéré).',
};

export default async function PageSondages() {
  const [sondages, session] = await Promise.all([listerSondagesOuverts(), getSession()]);

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
          <Heading niveau={1}>Sondages</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Vote connecté obligatoire. 2 modes : classique (vote brut) ou pondéré (méthode des
            quotas dès 300 répondant·es).
          </p>
        </div>
        <Link
          href="/s-informer/sondages/nouveau"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {session !== null ? 'Créer un sondage' : 'Connecte-toi pour créer'}
        </Link>
      </header>

      {sondages.length === 0 ? (
        <Alert variant="info" titre="Aucun sondage publié pour le moment">
          Crée le premier sondage pour ouvrir la liste.
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sondages.map((s) => (
            <li key={s.id}>
              <Card variant="ombre" className="flex h-full flex-col gap-2">
                <header className="flex items-center justify-between gap-2">
                  <Badge variant={s.mode === 'pondere' ? 'accent' : 'brand'}>
                    {s.mode === 'pondere' ? 'Pondéré' : 'Classique'}
                  </Badge>
                  {s.statut === 'ferme' ? <Badge variant="default">Fermé</Badge> : null}
                </header>
                <h2 className="text-lg font-bold leading-tight text-text-1">
                  <Link
                    href={`/s-informer/sondages/${s.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {s.titre}
                  </Link>
                </h2>
                <p className="line-clamp-3 text-sm text-text-2">{s.question}</p>
                <p className="mt-auto text-xs text-text-3">{s.options.length} options</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

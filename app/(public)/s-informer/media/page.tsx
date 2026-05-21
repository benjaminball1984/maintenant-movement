import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { listerMediasPublies } from '@/lib/media/requetes';
import { cn } from '@/lib/utils';
import type { TypeMedia } from '@/types/database';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Média Maintenant',
  description:
    'Éditos, tribunes, articles, brèves Reuters/AP, dessins, podcasts, vidéos, lives, newsletter.',
};

interface PageMediaProps {
  searchParams: Promise<{ type?: string }>;
}

const LIBELLE_TYPE: Record<TypeMedia, string> = {
  edito: 'Éditos',
  tribune: 'Tribunes',
  article: 'Articles',
  breve: 'Brèves',
  dessin: 'Dessins',
  podcast: 'Podcasts',
  video: 'Vidéos',
  live: 'Lives',
  newsletter: 'Newsletter',
};

const LISTE_TYPES: TypeMedia[] = [
  'edito',
  'tribune',
  'article',
  'breve',
  'dessin',
  'podcast',
  'video',
  'live',
  'newsletter',
];

function estTypeValide(v: string | undefined): v is TypeMedia {
  return v !== undefined && (LISTE_TYPES as string[]).includes(v);
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default async function PageMedia({ searchParams }: PageMediaProps) {
  const { type } = await searchParams;
  const filtre = estTypeValide(type) ? type : undefined;
  const medias = await listerMediasPublies(filtre);
  const ongletActif = filtre ?? 'tous';

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
        <Heading niveau={1}>Média Maintenant</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Éditos, tribunes, articles, brèves Reuters/AP, dessins, podcasts, vidéos, lives,
          newsletter. Voir aussi{' '}
          <Link href="/s-informer/radio" className="underline">
            Maintenant Radio
          </Link>{' '}
          et{' '}
          <Link href="/s-informer/journal" className="underline">
            Maintenant Médias (journal-affiche)
          </Link>
          .
        </p>
      </header>

      <nav aria-label="Type de média" className="mb-8 flex flex-wrap gap-2 border-b border-border">
        <Link
          href="/s-informer/media"
          className={
            ongletActif === 'tous'
              ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
              : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
          }
        >
          Tous
        </Link>
        {LISTE_TYPES.map((t) => (
          <Link
            key={t}
            href={`/s-informer/media?type=${t}`}
            className={
              ongletActif === t
                ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
                : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
            }
          >
            {LIBELLE_TYPE[t]}
          </Link>
        ))}
      </nav>

      {medias.length === 0 ? (
        <Alert variant="info" titre="Aucun média publié pour ce filtre">
          La rédaction publiera bientôt. Les éditos et la newsletter sont produits par l'équipe
          nationale ; tribunes et articles sont ouverts à toustes (modération a posteriori).
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medias.map((m) => (
            <li key={m.id}>
              <Card variant="ombre" className={cn('flex h-full flex-col gap-2')}>
                <header className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      m.type === 'edito' ? 'brand' : m.type === 'breve' ? 'accent' : 'default'
                    }
                  >
                    {LIBELLE_TYPE[m.type]}
                  </Badge>
                  {m.provenance_externe !== null ? (
                    <span className="text-xs text-text-3">via {m.provenance_externe}</span>
                  ) : null}
                </header>
                <h2 className="text-lg font-bold leading-tight text-text-1">
                  <Link
                    href={`/s-informer/media/${m.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {m.titre}
                  </Link>
                </h2>
                <p className="line-clamp-3 text-sm text-text-2">{m.corps.slice(0, 240)}</p>
                <footer className="mt-auto flex items-center justify-between text-xs text-text-3">
                  <span>
                    {[m.auteurice_prenom, m.auteurice_nom]
                      .filter((s) => s !== null && s.trim() !== '')
                      .join(' ') || 'Rédaction'}
                  </span>
                  {m.publie_le !== null ? (
                    <span>{FORMATEUR.format(new Date(m.publie_le))}</span>
                  ) : null}
                </footer>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

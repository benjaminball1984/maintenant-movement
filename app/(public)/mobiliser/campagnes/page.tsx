import { CarteCampagne } from '@/components/campagnes/CarteCampagne';
import { Alert, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerCampagnesPubliees } from '@/lib/campagnes/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Campagnes',
  description:
    'Campagnes citoyennes (assemblages thématiques de pétitions, mobilisations, cagnottes, sondages).',
};

/**
 * Page liste des campagnes (`/mobiliser/campagnes`, chantier 3.2).
 *
 * Une campagne = un wrapper thématique qui assemble plusieurs modules
 * (pétition + mobilisation + cagnotte + sondage + page éditoriale).
 * Modération a priori (cf. spec §11).
 */
export default async function PageCampagnes() {
  const [campagnes, session] = await Promise.all([listerCampagnesPubliees(), getSession()]);
  const personneConnectee = session !== null;

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">
            <Link href="/mobiliser" className="text-text-3 hover:text-brand">
              Mobiliser
            </Link>
          </p>
          <Heading niveau={1} className="mt-1">
            Campagnes
          </Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Une campagne, c'est un assemblage thématique : une pétition + une mobilisation + une
            cagnotte + un sondage + une page éditoriale, autour d'un même combat. Modération avant
            publication.
          </p>
        </div>
        <Link
          href="/mobiliser/campagnes/nouvelle"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {personneConnectee ? 'Lancer une campagne' : 'Connecte-toi pour lancer'}
        </Link>
      </header>

      {campagnes.length === 0 ? (
        <Alert variant="info" titre="Aucune campagne publiée">
          Les premières campagnes Maintenant! apparaîtront ici. Tu peux être à l'origine de la
          première.
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campagnes.map((campagne, index) => (
            <li key={campagne.id}>
              <CarteCampagne campagne={campagne} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <p>
          Les campagnes sont modérées <strong>a priori</strong>, avant publication, par l'équipe
          Maintenant!. Une fois la campagne validée, tu pourras y attacher tes modules (pétitions,
          mobilisations, etc.) depuis sa page.
        </p>
      </footer>
    </Container>
  );
}

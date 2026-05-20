import { FormulaireCreationCampagne } from '@/components/campagnes/FormulaireCreationCampagne';
import { Alert, Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';
import { creerCampagne } from '../actions';

export const metadata: Metadata = {
  title: 'Lancer une campagne',
};

export default async function PageCreationCampagne() {
  await getSessionOuRediriger('/mobiliser/campagnes/nouvelle');

  return (
    <Container taille="md" className="py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">
          <Link href="/mobiliser/campagnes" className="hover:text-brand">
            ← Toutes les campagnes
          </Link>
        </p>
        <Heading niveau={1} className="mt-1">
          Lancer une campagne
        </Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Une campagne assemble plusieurs modules (pétition, mobilisation, cagnotte, sondage, page
          éditoriale) autour d'un combat commun. Tu crées d'abord la campagne, puis tu attaches les
          modules.
        </p>
      </header>

      <Alert variant="info" titre="Modération a priori">
        Comme les pétitions, les campagnes sont examinées <strong>avant</strong> publication. Délai
        habituel : 24 à 48 heures.
      </Alert>

      <div className="mt-8">
        <FormulaireCreationCampagne creerCampagne={creerCampagne} />
      </div>
    </Container>
  );
}

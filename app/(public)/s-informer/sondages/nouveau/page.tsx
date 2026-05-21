import { creerSondage } from '@/app/(public)/s-informer/sondages/actions';
import { FormulaireCreationSondage } from '@/components/sondages/FormulaireCreationSondage';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Créer un sondage' };

export default async function PageNouveauSondage() {
  await getSessionOuRediriger('/s-informer/sondages/nouveau');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/sondages" className="hover:text-brand">
          ← Sondages
        </Link>
      </p>
      <Heading niveau={1}>Créer un sondage</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Vote connecté obligatoire (cf. doctrine §4D). Choisis entre le mode classique (vote brut) ou
        pondéré (méthode des quotas dès 300 répondant·es).
      </p>
      <div className="mt-8">
        <FormulaireCreationSondage creerSondage={creerSondage} />
      </div>
    </Container>
  );
}

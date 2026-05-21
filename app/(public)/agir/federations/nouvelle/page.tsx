import { creerFederation } from '@/app/(public)/agir/communes/actions';
import { FormulaireCreationFederation } from '@/components/communes/FormulaireCreationFederation';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Créer une fédération' };

export default async function PageNouvelleFederation() {
  await getSessionOuRediriger('/agir/federations/nouvelle');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/federations" className="hover:text-brand">
          ← Fédérations
        </Link>
      </p>
      <Heading niveau={1}>Créer une fédération</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Subsidiarité par accord mutuel : à chaque palier, les entités donnent leur accord pour
        rejoindre. Cf. doctrine §7B.
      </p>
      <div className="mt-8">
        <FormulaireCreationFederation creerFederation={creerFederation} />
      </div>
    </Container>
  );
}

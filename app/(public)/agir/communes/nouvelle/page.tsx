import { creerCommuneLibre } from '@/app/(public)/agir/communes/actions';
import { FormulaireCreationCommuneLibre } from '@/components/communes/FormulaireCreationCommuneLibre';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Créer une commune libre' };

export default async function PageNouvelleCommune() {
  await getSessionOuRediriger('/agir/communes/nouvelle');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/communes" className="hover:text-brand">
          ← Communes
        </Link>
      </p>
      <Heading niveau={1}>Créer une commune libre</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Pour les territoires non couverts par la cartographie pré-créée (ZAD, quartier
        inter-communal, etc.). Cf. doctrine §7B.
      </p>
      <div className="mt-8">
        <FormulaireCreationCommuneLibre creerCommuneLibre={creerCommuneLibre} />
      </div>
    </Container>
  );
}

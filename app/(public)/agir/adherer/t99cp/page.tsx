import { adhererT99CP } from '@/app/(public)/agir/adherer/actions';
import { FormulaireAdhesionT99CP } from '@/components/adhesion/FormulaireAdhesionT99CP';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Adhésion 12 99-coin' };

export default async function PageAdhererT99CP() {
  await getSessionOuRediriger('/agir/adherer/t99cp');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/adherer" className="hover:text-brand">
          ← Adhérer
        </Link>
      </p>
      <Heading niveau={1}>Adhésion 12 99-coin</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Transaction T99CP (Polygon). Pour les personnes déjà équipées en wallet. Frais 0 %.
      </p>
      <div className="mt-8">
        <FormulaireAdhesionT99CP adhererT99CP={adhererT99CP} />
      </div>
    </Container>
  );
}

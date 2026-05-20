import { adhererGratuit } from '@/app/(public)/agir/adherer/actions';
import { FormulaireAdhesionGratuit } from '@/components/adhesion/FormulaireAdhesionGratuit';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Adhésion gratuite' };

export default async function PageAdhererGratuit() {
  await getSessionOuRediriger('/agir/adherer/gratuit');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/adherer" className="hover:text-brand">
          ← Adhérer
        </Link>
      </p>
      <Heading niveau={1}>Adhésion gratuite</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Pas de barrière financière. Tu deviens adhérent·e pour 365 jours, on te rappelle pour le
        renouvellement par mail.
      </p>
      <div className="mt-8">
        <FormulaireAdhesionGratuit adhererGratuit={adhererGratuit} />
      </div>
    </Container>
  );
}

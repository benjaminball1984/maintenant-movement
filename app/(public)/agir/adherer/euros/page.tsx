import { adhererEuros } from '@/app/(public)/agir/adherer/actions';
import { FormulaireAdhesionEuros } from '@/components/adhesion/FormulaireAdhesionEuros';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Adhésion 12 €' };

export default async function PageAdhererEuros() {
  await getSessionOuRediriger('/agir/adherer/euros');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/adherer" className="hover:text-brand">
          ← Adhérer
        </Link>
      </p>
      <Heading niveau={1}>Adhésion 12 €</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Paiement par carte. Tu deviens adhérent·e pour 365 jours après confirmation Stripe.
      </p>
      <div className="mt-8">
        <FormulaireAdhesionEuros adhererEuros={adhererEuros} />
      </div>
    </Container>
  );
}

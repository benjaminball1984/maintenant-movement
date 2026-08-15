import { adhererEuros } from '@/app/(public)/agir/adherer/actions';
import { FormulaireAdhesionEuros } from '@/components/adhesion/FormulaireAdhesionEuros';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import { paiementReelDisponible } from '@/lib/payments';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Adhésion 12 €' };

export default async function PageAdhererEuros() {
  // Tant que Stripe n'encaisse pas réellement, ce parcours est fermé et on
  // renvoie vers le choix des chemins (où seul « gratuit » sera proposé).
  // Sans ce garde-fou, l'adhésion partait vers le simulateur : la personne
  // devenait adhérente sans avoir payé et sans le savoir.
  if (!paiementReelDisponible()) {
    redirect('/agir/adherer');
  }

  await getSessionOuRediriger('/agir/adherer/euros');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/adherer" className="hover:text-brand">
          Retour
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

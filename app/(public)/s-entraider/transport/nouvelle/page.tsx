import { creerOffreEntraide } from '@/app/(public)/s-entraider/actions';
import { FormulaireCreationOffre } from '@/components/entraide/FormulaireCreationOffre';
import { Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Publier une offre — transport' };

export default async function PageNouvelleTransport() {
  await getSessionOuRediriger('/s-entraider/transport/nouvelle');
  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/transport" className="hover:text-brand">
          ← Transport solidaire
        </Link>
      </p>
      <Heading niveau={1}>Publier une offre</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Propose un trajet ou cherche un covoiturage solidaire.
      </p>
      <div className="mt-8">
        <FormulaireCreationOffre
          typeParDefaut="transport"
          creerOffreEntraide={creerOffreEntraide}
        />
      </div>
    </>
  );
}

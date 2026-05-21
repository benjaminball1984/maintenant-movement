import { creerOffreEntraide } from '@/app/(public)/s-entraider/actions';
import { FormulaireCreationOffre } from '@/components/entraide/FormulaireCreationOffre';
import { Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Publier une offre — hébergement' };

export default async function PageNouvelleHebergement() {
  await getSessionOuRediriger('/s-entraider/hebergement/nouvelle');
  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/hebergement" className="hover:text-brand">
          ← Hébergement solidaire
        </Link>
      </p>
      <Heading niveau={1}>Publier une offre</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Tu peux proposer un hébergement, ou chercher à être hébergé·e. Modération a posteriori.
      </p>
      <div className="mt-8">
        <FormulaireCreationOffre
          typeParDefaut="hebergement"
          creerOffreEntraide={creerOffreEntraide}
        />
      </div>
    </>
  );
}

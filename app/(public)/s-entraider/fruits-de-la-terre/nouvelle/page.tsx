import { creerOffreEntraide } from '@/app/(public)/s-entraider/actions';
import { FormulaireCreationOffre } from '@/components/entraide/FormulaireCreationOffre';
import { Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Publier une offre — fruits de la terre' };

export default async function PageNouvelleFruitsTerre() {
  await getSessionOuRediriger('/s-entraider/fruits-de-la-terre/nouvelle');
  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/fruits-de-la-terre" className="hover:text-brand">
          ← Fruits de la terre
        </Link>
      </p>
      <Heading niveau={1}>Publier une offre</Heading>
      <p className="mt-3 max-w-2xl text-text-2">Propose ou cherche une entraide alimentaire.</p>
      <div className="mt-8">
        <FormulaireCreationOffre
          typeParDefaut="fruits_terre"
          creerOffreEntraide={creerOffreEntraide}
        />
      </div>
    </>
  );
}

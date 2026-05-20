import { creerOffreEntraide } from '@/app/(public)/s-entraider/actions';
import { FormulaireCreationOffre } from '@/components/entraide/FormulaireCreationOffre';
import { Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Publier une offre — qui prête tout' };

export default async function PageNouvelleQuiPreteTout() {
  await getSessionOuRediriger('/s-entraider/qui-prete-tout/nouvelle');
  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/qui-prete-tout" className="hover:text-brand">
          ← Qui prête tout
        </Link>
      </p>
      <Heading niveau={1}>Publier une offre</Heading>
      <p className="mt-3 max-w-2xl text-text-2">Propose ou cherche un prêt d'objet.</p>
      <div className="mt-8">
        <FormulaireCreationOffre
          typeParDefaut="pret_objet"
          creerOffreEntraide={creerOffreEntraide}
        />
      </div>
    </>
  );
}

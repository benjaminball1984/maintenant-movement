import { creerMinimarche } from '@/app/(public)/s-entraider/marche/actions';
import { FormulaireCreationMinimarche } from '@/components/marche/FormulaireCreationMinimarche';
import { Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Annoncer un minimarché (marché solidaire)' };

export default async function PageNouveauMinimarche() {
  await getSessionOuRediriger('/s-entraider/marche/minimarches/nouveau');
  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/marche/minimarches" className="hover:text-brand">
          ← Minimarchés
        </Link>
      </p>
      <Heading niveau={1}>Annoncer un minimarché solidaire</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Lieu physique, date, monnaies acceptées. Affiché sur la carte unifiée (chantier 6.1).
        Préfigure le Comptoir de Change T99CP.
      </p>
      <div className="mt-8">
        <FormulaireCreationMinimarche creerMinimarche={creerMinimarche} />
      </div>
    </>
  );
}

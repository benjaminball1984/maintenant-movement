import { creerBoutique } from '@/app/(public)/s-entraider/marche/actions';
import { FormulaireCreationBoutique } from '@/components/marche/FormulaireCreationBoutique';
import { Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Créer une boutique (marché solidaire)' };

export default async function PageNouvelleBoutique() {
  await getSessionOuRediriger('/s-entraider/marche/boutiques/nouvelle');
  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/marche/boutiques" className="hover:text-brand">
          ← Boutiques
        </Link>
      </p>
      <Heading niveau={1}>Créer une boutique éphémère</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Permanente ou avec une plage de dates. Tu rattacheras ensuite tes produits à la boutique
        depuis leur fiche.
      </p>
      <div className="mt-8">
        <FormulaireCreationBoutique creerBoutique={creerBoutique} />
      </div>
    </>
  );
}

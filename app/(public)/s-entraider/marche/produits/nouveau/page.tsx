import { creerProduitMarche } from '@/app/(public)/s-entraider/marche/actions';
import { FormulaireCreationProduit } from '@/components/marche/FormulaireCreationProduit';
import { Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Publier un produit (marché solidaire)' };

export default async function PageNouveauProduit() {
  await getSessionOuRediriger('/s-entraider/marche/produits/nouveau');
  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/marche/produits" className="hover:text-brand">
          ← Produits
        </Link>
      </p>
      <Heading niveau={1}>Publier un produit</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Vente OU don gratuit (toggle ci-dessous). Double affichage T99CP/Euros. Notation 5 étoiles
        unilatérale après la transaction.
      </p>
      <div className="mt-8">
        <FormulaireCreationProduit creerProduitMarche={creerProduitMarche} />
      </div>
    </>
  );
}

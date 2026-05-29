import { CarteProduit } from '@/components/marche/CarteProduit';
import { Alert, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerProduitsMarche } from '@/lib/marche/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Marché solidaire — Produits' };

type FiltreMode = 'tous' | 'vente' | 'don';

interface PageProduitsProps {
  searchParams: Promise<{ mode?: string; categorie?: string }>;
}

const ONGLETS: Array<{ slug: FiltreMode; libelle: string; href: string }> = [
  { slug: 'tous', libelle: 'Tous', href: '/s-entraider/marche/produits' },
  { slug: 'vente', libelle: 'En vente', href: '/s-entraider/marche/produits?mode=vente' },
  { slug: 'don', libelle: 'En don', href: '/s-entraider/marche/produits?mode=don' },
];

function estModeValide(v: string | undefined): v is 'vente' | 'don' {
  return v === 'vente' || v === 'don';
}

export default async function PageProduits({ searchParams }: PageProduitsProps) {
  const { mode, categorie } = await searchParams;
  const filtreMode = estModeValide(mode) ? mode : undefined;
  const [produits, session] = await Promise.all([
    listerProduitsMarche({ mode: filtreMode, categorie }),
    getSession(),
  ]);
  const ongletActif: FiltreMode = filtreMode ?? 'tous';
  const personneConnectee = session !== null;

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">
            <Link href="/s-entraider/marche" className="hover:text-brand">
              ← Marché solidaire
            </Link>
          </p>
          <Heading niveau={1}>Produits</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Annonces entre particulier·ères : vente ou don gratuit. Double affichage T99CP/Euros,
            frais 0 % T99CP, 5 % EUR.
          </p>
        </div>
        <Link
          href="/s-entraider/marche/produits/nouveau"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {personneConnectee ? 'Publier un produit' : 'Connecte-toi pour publier'}
        </Link>
      </header>

      <nav aria-label="Mode" className="mb-8 flex flex-wrap gap-2 border-b border-border">
        {ONGLETS.map((onglet) => (
          <Link
            key={onglet.slug}
            href={onglet.href}
            className={cn(
              'border-b-2 px-3 py-2 text-sm transition',
              ongletActif === onglet.slug
                ? 'border-brand text-brand'
                : 'border-transparent text-text-3 hover:text-text-1',
            )}
          >
            {onglet.libelle}
          </Link>
        ))}
      </nav>

      {produits.length === 0 ? (
        <Alert variant="info" titre="Aucun produit pour ce filtre">
          Publie un produit pour ouvrir la liste, ou élargis le filtre.
        </Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {produits.map((produit, index) => (
            <li key={produit.id}>
              <CarteProduit produit={produit} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

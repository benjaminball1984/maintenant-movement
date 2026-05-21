import { CarteBoutique } from '@/components/marche/CarteBoutique';
import { Alert, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerBoutiques } from '@/lib/marche/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Marché solidaire — Boutiques' };

export default async function PageBoutiques() {
  const [boutiques, session] = await Promise.all([listerBoutiques(), getSession()]);
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
          <Heading niveau={1}>Boutiques éphémères</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Vide-greniers, artisans, brocantes, ventes thématiques. Une boutique regroupe plusieurs
            produits sous une même identité.
          </p>
        </div>
        <Link
          href="/s-entraider/marche/boutiques/nouvelle"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {personneConnectee ? 'Créer une boutique' : 'Connecte-toi pour créer'}
        </Link>
      </header>

      {boutiques.length === 0 ? (
        <Alert variant="info" titre="Aucune boutique ouverte pour le moment">
          Crée la première. Vide-grenier, atelier d'artisanat, brocante : c'est l'endroit pour
          fédérer tes produits sous une identité.
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boutiques.map((boutique, index) => (
            <li key={boutique.id}>
              <CarteBoutique boutique={boutique} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

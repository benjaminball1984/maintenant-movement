import { CarteMinimarche } from '@/components/marche/CarteMinimarche';
import { Alert, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerMinimarches } from '@/lib/marche/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Marché solidaire — Minimarchés' };

export default async function PageMinimarches() {
  const [minimarches, session] = await Promise.all([listerMinimarches(), getSession()]);
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
          <Heading niveau={1}>Minimarchés solidaires</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Marchés physiques solidaires acceptant les 4 monnaies (T99CP, Euros, Ğ1, monnaies
            locales). Préfigure le Comptoir de Change T99CP.
          </p>
        </div>
        <Link
          href="/s-entraider/marche/minimarches/nouveau"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {personneConnectee ? 'Annoncer un minimarché' : 'Connecte-toi pour annoncer'}
        </Link>
      </header>

      {minimarches.length === 0 ? (
        <Alert variant="info" titre="Aucun minimarché annoncé">
          Pas encore d'événement programmé. Annonce le premier minimarché solidaire dans ta commune
          ou ton quartier.
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {minimarches.map((minimarche, index) => (
            <li key={minimarche.id}>
              <CarteMinimarche minimarche={minimarche} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

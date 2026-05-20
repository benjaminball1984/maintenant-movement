import { CarteMomentSolidaire } from '@/components/moments/CarteMomentSolidaire';
import { Alert, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { LISTE_TYPES_MOMENTS, TYPES_MOMENTS } from '@/lib/moments/config';
import { listerMomentsSolidaires } from '@/lib/moments/requetes';
import { cn } from '@/lib/utils';
import type { TypeMomentSolidaire } from '@/types/database';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Moments solidaires',
  description:
    'Porte-à-porte solidaire, maraudes, vide-greniers, soutiens, manifestations, rencontres, concerts, repas solidaires.',
};

interface PageMomentsProps {
  searchParams: Promise<{ type?: string }>;
}

function estTypeValide(v: string | undefined): v is TypeMomentSolidaire {
  return v !== undefined && v in TYPES_MOMENTS;
}

export default async function PageMomentsSolidaires({ searchParams }: PageMomentsProps) {
  const { type } = await searchParams;
  const filtre = estTypeValide(type) ? type : undefined;
  const [moments, session] = await Promise.all([
    listerMomentsSolidaires({ type: filtre, parentsSeulement: true }),
    getSession(),
  ]);
  const ongletActif = filtre ?? 'tous';

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
          <Heading niveau={1}>Moments solidaires</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Mouvement de service au service de nous-mêmes. Auto-éducation populaire,
            auto-solidarité. 8 types, dont le porte-à-porte solidaire en 7 RDV automatiques. Cf.
            doctrine §7C.
          </p>
        </div>
        <Link
          href="/agir/moments-solidaires/nouveau"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {session !== null ? 'Organiser un moment' : 'Connecte-toi pour organiser'}
        </Link>
      </header>

      <nav aria-label="Type de moment" className="mb-8 flex flex-wrap gap-2 border-b border-border">
        <Link
          href="/agir/moments-solidaires"
          className={
            ongletActif === 'tous'
              ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
              : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
          }
        >
          Tous
        </Link>
        {LISTE_TYPES_MOMENTS.map((t) => (
          <Link
            key={t.type}
            href={`/agir/moments-solidaires?type=${t.type}`}
            className={
              ongletActif === t.type
                ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
                : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
            }
          >
            {t.libelle}
          </Link>
        ))}
      </nav>

      {moments.length === 0 ? (
        <Alert variant="info" titre="Aucun moment programmé">
          Organise le premier. Le porte-à-porte solidaire crée automatiquement 7 RDV enfants à
          partir d'une date de début.
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {moments.map((moment, index) => (
            <li key={moment.id}>
              <CarteMomentSolidaire moment={moment} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

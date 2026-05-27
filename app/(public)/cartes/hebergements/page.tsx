import { CarteWrapper } from '@/components/carte/CarteWrapper';
import { Alert, Container, Heading } from '@/components/ui';
import { chargerPointsHebergement } from '@/lib/carte/donnees';
import { HandHelping } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Carte des hébergements solidaires',
  description: 'Carte dédiée aux hébergements solidaires proposés par les membres.',
};

export default async function PageCarteHebergements() {
  const points = await chargerPointsHebergement();

  return (
    <Container taille="lg" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/cartes" className="hover:text-brand">
          ← Toutes les cartes
        </Link>
      </p>
      <Heading niveau={1}>
        <HandHelping size={26} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Hébergements solidaires
      </Heading>
      <p className="mt-2 max-w-2xl text-text-2">
        Carte dédiée aux hébergements proposés par les membres du mouvement. Pour proposer ton
        hébergement, va sur{' '}
        <Link href="/s-entraider/hebergement/nouvelle" className="text-brand hover:underline">
          /s-entraider/hebergement
        </Link>
        .
      </p>
      <p className="mt-1 text-xs text-text-3">{points.length} hébergements affichés.</p>

      {points.length === 0 ? (
        <Alert variant="info" titre="Aucun hébergement géolocalisé" className="mt-6">
          Pas encore d'offre publiée avec latitude/longitude. Reviens bientôt.
        </Alert>
      ) : (
        <div className="mt-6">
          <CarteWrapper points={points} />
        </div>
      )}
    </Container>
  );
}

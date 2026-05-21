import { creerMomentSolidaire } from '@/app/(public)/agir/moments-solidaires/actions';
import { FormulaireCreationMoment } from '@/components/moments/FormulaireCreationMoment';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Organiser un moment solidaire' };

export default async function PageNouveauMoment() {
  await getSessionOuRediriger('/agir/moments-solidaires/nouveau');
  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/moments-solidaires" className="hover:text-brand">
          ← Moments solidaires
        </Link>
      </p>
      <Heading niveau={1}>Organiser un moment solidaire</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Pour organiser dans une commune, il faut en être membre actif·ve. Le porte-à-porte génère
        automatiquement les 7 RDV enfants à partir de la date de début.
      </p>
      <div className="mt-8">
        <FormulaireCreationMoment creerMomentSolidaire={creerMomentSolidaire} />
      </div>
    </Container>
  );
}

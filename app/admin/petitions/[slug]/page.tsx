import { editerPetition } from '@/app/(public)/mobiliser/petitions/actions';
import { BoutonArchiverPetition } from '@/components/petitions/BoutonArchiverPetition';
import { FormulaireEditionPetition } from '@/components/petitions/FormulaireEditionPetition';
import { Heading } from '@/components/ui';
import { petitionParSlug } from '@/lib/petitions/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageEditionPetitionProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageEditionPetitionProps): Promise<Metadata> {
  const { slug } = await params;
  const petition = await petitionParSlug(slug);
  return { title: petition === null ? 'Pétition introuvable' : `Éditer : ${petition.titre}` };
}

/**
 * Page d'édition d'une pétition par l'équipe (chantier 13.2).
 *
 * Charge la pétition par slug (la RLS autorise la lecture tous statuts aux
 * admins/modérateurices) et rend `FormulaireEditionPetition`, qui appelle la
 * Server Action `editerPetition`. 404 si le slug ne correspond à rien de
 * lisible.
 */
export default async function PageEditionPetition({ params }: PageEditionPetitionProps) {
  const { slug } = await params;
  const petition = await petitionParSlug(slug);
  if (petition === null) {
    notFound();
  }

  return (
    <section className="grid gap-6">
      <header>
        <Link href="/admin/petitions" className="text-sm text-text-3 hover:text-brand">
          ← Toutes les pétitions
        </Link>
        <Heading niveau={1} apparenceComme={2} className="mt-2">
          Éditer la pétition
        </Heading>
        <p className="mt-2 text-text-2">{petition.titre}</p>
      </header>

      <FormulaireEditionPetition petition={petition} editerPetition={editerPetition} />

      {petition.statut !== 'archivee' ? (
        <div className="mt-6">
          <BoutonArchiverPetition petitionId={petition.id} />
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-border bg-surface-2 p-4 text-sm text-text-3">
          Cette pétition est déjà archivée. Pour la republier, modifie son statut en SQL ou contacte
          un admin national.
        </div>
      )}
    </section>
  );
}

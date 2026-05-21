import { FormulaireCreationMobilisation } from '@/components/mobilisations/FormulaireCreationMobilisation';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';
import { creerMobilisation } from '../actions';

export const metadata: Metadata = {
  title: 'Créer une mobilisation',
  description:
    'Crée une mobilisation citoyenne (rassemblement, AG, action). Publication immédiate, modération a posteriori.',
};

/**
 * Page de création d'une mobilisation (`/mobiliser/mobilisations/nouvelle`).
 *
 * Auth requise (`getSessionOuRediriger`). Publication immédiate au statut
 * `publiee` (modération a posteriori côté équipe Maintenant!).
 */
export default async function PageCreationMobilisation() {
  await getSessionOuRediriger('/mobiliser/mobilisations/nouvelle');

  return (
    <Container taille="md" className="py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">
          <Link href="/mobiliser/mobilisations" className="hover:text-brand">
            ← Toutes les mobilisations
          </Link>
        </p>
        <Heading niveau={1} className="mt-1">
          Créer une mobilisation
        </Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Annonce un rassemblement, une AG, une action. Plus le lieu et la date sont précis, mieux
          c'est. Modération a posteriori : ta mobilisation est publiée immédiatement, et l'équipe
          Maintenant! peut la retirer en cas de problème.
        </p>
      </header>

      <FormulaireCreationMobilisation creerMobilisation={creerMobilisation} />
    </Container>
  );
}

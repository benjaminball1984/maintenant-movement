import { Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FormulaireCreationOrganisation } from './FormulaireCreationOrganisation';

export const metadata: Metadata = { title: 'Créer une organisation' };

/**
 * Page de création d'une organisation (épopée réseau V2, chantier B.1).
 * Réservée aux personnes connectées.
 */
export default async function PageNouvelleOrganisation() {
  const session = await getSession();
  if (session === null) {
    redirect('/connexion?prochaine=/organisations/nouvelle');
  }

  return (
    <Container taille="sm" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/organisations" className="hover:text-brand">
          ← Toutes les organisations
        </Link>
      </p>
      <Heading niveau={1} className="mb-2">
        Créer une organisation
      </Heading>
      <p className="mb-6 text-text-2">
        Crée la page d’une organisation (collectif, association, syndicat…). Tu en deviens le·la
        gestionnaire provisoire. La page est visible tout de suite ; le badge « officiel » est
        accordé après vérification.
      </p>
      <FormulaireCreationOrganisation />
    </Container>
  );
}

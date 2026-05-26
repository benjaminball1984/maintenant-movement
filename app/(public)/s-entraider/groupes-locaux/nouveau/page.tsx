import { FormulaireCreationGroupeEntraide } from '@/components/groupe-entraide-local/FormulaireCreationGroupeEntraide';
import { Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un groupe d’entraide local',
  description:
    'Crée un groupe d’entraide pour ton quartier, ton immeuble, ton AMAP, ton voisinage. Une porte d’entrée par l’entraide, pas par le militantisme.',
};

/**
 * Page de création d'un groupe d'entraide local (cycle V2 V2.3.2).
 *
 * Protégée : nécessite une session active. Soumet au formulaire client
 * `FormulaireCreationGroupeEntraide` qui appelle la Server Action.
 */
export default async function PageNouveauGroupeEntraide() {
  await getSessionOuRediriger('/s-entraider/groupes-locaux/nouveau');

  return (
    <Container taille="md" className="py-12">
      <header className="mb-8">
        <Heading niveau={1}>Créer un groupe d’entraide local</Heading>
        <p className="mt-2 text-text-2">
          Quartier, immeuble, AMAP, voisinage : un groupe rassemble des personnes qui veulent
          s’entraider concrètement. Pas besoin d’être militant·e.
        </p>
      </header>
      <FormulaireCreationGroupeEntraide />
    </Container>
  );
}

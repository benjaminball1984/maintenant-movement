import { PageSousEspaceStub } from '@/components/home/PageSousEspaceStub';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mobilisations',
};

export default function PageMobilisations() {
  return (
    <PageSousEspaceStub
      espaceParent={{ slug: 'mobiliser', libelle: 'Mobiliser' }}
      titre="Mobilisations"
      chantier="chantier 3.2"
      description="Agenda type Démosphère géolocalisé, modération a posteriori, statut « je participe » d'un clic. Implémentation au chantier 3.2."
    />
  );
}

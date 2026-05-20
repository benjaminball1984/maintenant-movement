import { PageSousEspaceStub } from '@/components/home/PageSousEspaceStub';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pétitions',
};

export default function PagePetitions() {
  return (
    <PageSousEspaceStub
      espaceParent={{ slug: 'mobiliser', libelle: 'Mobiliser' }}
      titre="Pétitions"
      chantier="chantier 3.1"
      description="Liste des pétitions en cours, création de pétitions, modération a priori, compteur stretch ×1,5 à 90 %. Implémentation au chantier 3.1."
    />
  );
}

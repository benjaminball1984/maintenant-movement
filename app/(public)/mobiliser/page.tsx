import { PageEspaceStub } from '@/components/home/PageEspaceStub';
import { trouverEspace } from '@/config/espaces';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mobiliser',
};

export default function PageMobiliser() {
  return (
    <PageEspaceStub
      espace={trouverEspace('mobiliser')}
      chantiersParSousEspace={{
        petitions: 'chantier 3.1',
        campagnes: 'chantier 3.2',
        mobilisations: 'chantier 3.2',
        cagnottes: 'chantier 3.3',
      }}
    />
  );
}

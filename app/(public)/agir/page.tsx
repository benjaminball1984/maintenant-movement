import { PageEspaceStub } from '@/components/home/PageEspaceStub';
import { trouverEspace } from '@/config/espaces';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agir',
};

export default function PageAgir() {
  return (
    <PageEspaceStub
      espace={trouverEspace('agir')}
      chantiersParSousEspace={{
        adherer: 'chantier 5.1',
        communes: 'chantier 5.2',
        'moments-solidaires': 'chantier 5.3',
        'autres-moyens': 'chantier 5.4',
      }}
    />
  );
}

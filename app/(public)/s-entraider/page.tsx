import { PageEspaceStub } from '@/components/home/PageEspaceStub';
import { trouverEspace } from '@/config/espaces';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'S’entraider',
};

export default function PageSEntraider() {
  return (
    <PageEspaceStub
      espace={trouverEspace('s-entraider')}
      chantiersParSousEspace={{
        hebergement: 'chantier 4.1',
        transport: 'chantier 4.1',
        'qui-prete-tout': 'chantier 4.1',
        'fruits-de-la-terre': 'chantier 4.1',
        sel: 'chantier 4.2',
        marche: 'chantier 4.3',
      }}
    />
  );
}

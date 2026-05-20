import { PageEspaceStub } from '@/components/home/PageEspaceStub';
import { trouverEspace } from '@/config/espaces';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'S’informer',
};

export default function PageSInformer() {
  return (
    <PageEspaceStub
      espace={trouverEspace('s-informer')}
      chantiersParSousEspace={{
        media: 'chantier 7.1',
        radio: 'chantier 7.2',
        journal: 'chantier 7.3',
        reseau: 'chantier 7.5',
        sondages: 'chantier 7.4',
        decider: 'chantier 7.6',
      }}
    />
  );
}

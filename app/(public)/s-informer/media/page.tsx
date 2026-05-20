import { PageSousEspaceStub } from '@/components/home/PageSousEspaceStub';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Média Maintenant',
};

export default function PageMedia() {
  return (
    <PageSousEspaceStub
      espaceParent={{ slug: 's-informer', libelle: 'S’informer' }}
      titre="Média Maintenant"
      chantier="chantier 7.1"
      description="Éditos, tribunes, articles, brèves (Reuters + AP), dessins, podcasts, vidéos, lives, archive newsletter. Implémentation au chantier 7.1."
    />
  );
}

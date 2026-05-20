import { PageEditorialeStub } from '@/components/home/PageEditorialeStub';
import { Alert } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ressources',
};

export default function PageRessources() {
  return (
    <PageEditorialeStub
      surtitre="Comprendre"
      titre="Ressources"
      placeholder={
        <Alert variant="info" titre="[TEXTE À FAIRE — page Ressources]">
          Contenu attendu : liens vers la doctrine complète, les textes de référence, les outils
          pour s'organiser (modèles de PV, kits porte-à-porte, charte modération, etc.),
          bibliographie politique. À rédiger par Lilou/Ben au chantier 2.2.
        </Alert>
      }
    />
  );
}

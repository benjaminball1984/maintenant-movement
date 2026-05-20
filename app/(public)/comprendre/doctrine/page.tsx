import { PageEditorialeStub } from '@/components/home/PageEditorialeStub';
import { Alert } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doctrine',
};

export default function PageDoctrine() {
  return (
    <PageEditorialeStub
      surtitre="Comprendre"
      titre="Doctrine fondatrice"
      placeholder={
        <Alert variant="info" titre="[TEXTE À FAIRE — doctrine fondatrice]">
          Contenu attendu : explication des grands principes (empouvoirement vs captation de
          pouvoir, mouvement de service au service de nous-mêmes, équivalence, moindre violence,
          légitimité d'expression par ancrage territorial réel, subsidiarité par accord mutuel,
          populisme progressiste inclusif démocratique émancipateur). Citations à mettre en avant :
          « Ce qui se fait pour les gens sans les gens se fait contre les gens. » + « Chanter
          aujourd'hui, pas seulement promettre demain. ». À rédiger par Lilou/Ben au chantier 2.2.
        </Alert>
      }
    />
  );
}

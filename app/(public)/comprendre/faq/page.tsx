import { PageEditorialeStub } from '@/components/home/PageEditorialeStub';
import { Alert } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
};

export default function PageFaq() {
  return (
    <PageEditorialeStub
      surtitre="Comprendre"
      titre="FAQ"
      placeholder={
        <Alert variant="info" titre="[TEXTE À FAIRE — FAQ Maintenant!]">
          Contenu attendu : questions fréquentes structurées en thématiques (adhésion,
          fonctionnement collégial, monnaie 99-coin, commune libre, RGPD et données, modération). À
          rédiger par Lilou/Ben au chantier 2.2 et à enrichir au fil des questions remontées par les
          premier·ères utilisateur·ices.
        </Alert>
      }
    />
  );
}

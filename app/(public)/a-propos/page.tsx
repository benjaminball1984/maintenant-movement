import { PageEditorialeStub } from '@/components/home/PageEditorialeStub';
import { Alert } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qui sommes-nous',
};

export default function PageAPropos() {
  return (
    <PageEditorialeStub
      surtitre="À propos"
      titre="Qui sommes-nous"
      placeholder={
        <Alert variant="info" titre="[TEXTE À FAIRE — page À propos]">
          Contenu attendu : présentation du mouvement Maintenant!, histoire, doctrine générale,
          premiers signataires, structuration (cosec gé en collégial), liens vers Doctrine et
          Commune libre. Citation à mettre en avant : « Le but de la plateforme n'est pas que la
          plateforme fonctionne. » À rédiger par Lilou/Ben au chantier 2.2.
        </Alert>
      }
    />
  );
}

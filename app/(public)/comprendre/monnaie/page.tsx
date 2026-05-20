import { PageEditorialeStub } from '@/components/home/PageEditorialeStub';
import { Alert } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monnaie 99-coin',
};

export default function PageMonnaie() {
  return (
    <PageEditorialeStub
      surtitre="Comprendre"
      titre="Monnaie 99-coin (T99CP)"
      placeholder={
        <Alert variant="info" titre="[TEXTE À FAIRE — page Monnaie 99-coin]">
          Contenu attendu : explication de la monnaie 99-coin (T99CP, The 99 Coin Project),
          équivalence 1 T99CP = 1 € = 1 minute, usages (adhésion 12 99-coin, dons cagnottes, SEL,
          RBU 30 99-coin/mois), comment se créer un wallet certifié, adresse de contrat Polygon. À
          rédiger par Lilou/Ben et l'équipe T99CP au chantier 2.2.
        </Alert>
      }
    />
  );
}

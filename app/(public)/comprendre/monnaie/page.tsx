import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import { LOREM_LONG } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monnaie 99-coin',
  description:
    'La monnaie 99-coin (T99CP, The 99 Coin Project) : équivalence, usages, wallet certifié.',
};

const FALLBACK = `Le 99-coin (T99CP, The 99 Coin Project) est la monnaie complémentaire de Maintenant!.

## Équivalence

1 T99CP = 1 € = 1 minute.

## Usages

- Adhésion : 12 T99CP par an
- Dons sur cagnottes solidaires
- SEL (Système d'Échange Local)
- Revenu de Base Universel : 30 T99CP/mois via wallet certifié

${LOREM_LONG}

## Créer un wallet certifié

${LOREM_LONG}

## Contrat Polygon

Adresse du contrat : 0x7275cfc83f486d53ca1379fc1f8025490bdcc79a (testnet Mumbai en dev, Polygon mainnet en prod).

${LOREM_LONG}
`;

export default function PageMonnaie() {
  return (
    <PageEditorialeCMS
      surtitre="Comprendre"
      titreParDefaut="Monnaie 99-coin (T99CP)"
      cle="page.comprendre.monnaie"
      loremFallback={FALLBACK}
    />
  );
}

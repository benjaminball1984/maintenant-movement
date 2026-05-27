import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import { LOREM_MOYEN } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Questions fréquentes sur le mouvement Maintenant!',
};

const FALLBACK = `Bienvenue sur la FAQ de Maintenant!. Ces questions sont mises à jour au fil des remontées des premier·ères utilisateur·ices.

## Adhésion et statuts

### Quels sont les statuts possibles ?

${LOREM_MOYEN}

### Comment adhérer ?

${LOREM_MOYEN}

## Fonctionnement collégial

### Qui décide quoi ?

${LOREM_MOYEN}

### Comment fonctionne la levée d'objections ?

${LOREM_MOYEN}

## Monnaie 99-coin

### Qu'est-ce que le T99CP ?

${LOREM_MOYEN}

## Commune libre

### Comment créer une commune libre ?

${LOREM_MOYEN}

## RGPD et données

### Quelles données collectez-vous ?

${LOREM_MOYEN}

### Comment exercer mes droits ?

${LOREM_MOYEN}

## Modération

### Qui modère le réseau social ?

${LOREM_MOYEN}
`;

export default function PageFaq() {
  return (
    <PageEditorialeCMS
      surtitre="Comprendre"
      titreParDefaut="Questions fréquentes"
      cle="page.comprendre.faq"
      loremFallback={FALLBACK}
    />
  );
}

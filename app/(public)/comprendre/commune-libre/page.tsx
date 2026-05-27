import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import { LOREM_LONG } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commune libre',
  description:
    'La commune libre : ancrage territorial du mouvement, gouvernance collégiale, fédération.',
};

const FALLBACK = `La commune libre est l'unité de base du mouvement Maintenant!. Elle se constitue sur un territoire (commune INSEE, quartier, village) avec au moins quelques cofondateurice·s.

## Qu'est-ce qu'une commune libre ?

${LOREM_LONG}

## Comment en créer une ?

${LOREM_LONG}

## Gouvernance collégiale

Chaque commune libre fonctionne en collège : prises de décisions par levée d'objections, mandats tournants, transparence des comptes.

${LOREM_LONG}

## Fédération et confédération

Les communes libres se fédèrent par bassin de vie, et les fédérations forment des confédérations. L'Assemblée Confédérale est tirée au sort en binôme avec incompatibilité de cumul.

${LOREM_LONG}
`;

export default function PageCommuneLibre() {
  return (
    <PageEditorialeCMS
      surtitre="Comprendre"
      titreParDefaut="La commune libre"
      cle="page.comprendre.commune-libre"
      loremFallback={FALLBACK}
    />
  );
}

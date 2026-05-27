import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import { LOREM_LONG } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Assemblée Confédérale',
  description:
    'Assemblée Confédérale des Communes et Territoires Libres : tirage au sort en binômes, incompatibilité de cumul, jugement majoritaire.',
};

const FALLBACK = `L'Assemblée Confédérale des Communes et Territoires Libres est l'instance de gouvernance nationale du mouvement Maintenant!.

## Constitution

Les mandats sont tirés au sort parmi les volontaires de chaque commune libre, par binômes (un·e titulaire, un·e suppléant·e). Incompatibilité de cumul : on ne peut pas être à la fois cosec gé d'une commune et mandat·e à l'Assemblée.

${LOREM_LONG}

## Méthodes de décision

L'Assemblée décide selon trois méthodes selon les sujets :

### Consensus

${LOREM_LONG}

### Levée d'objections

${LOREM_LONG}

### Jugement majoritaire (Balinski-Laraki)

${LOREM_LONG}

## Convocation et préavis

Une réunion de l'Assemblée doit être annoncée **au moins 2 semaines (15 jours)** à l'avance, avec notification à tous les membres concernés. Sans ce préavis, la décision n'est pas valable.

${LOREM_LONG}
`;

export default function PageAssembleeConfederale() {
  return (
    <PageEditorialeCMS
      surtitre="Comprendre"
      titreParDefaut="Assemblée Confédérale"
      cle="page.comprendre.assemblee-confederale"
      loremFallback={FALLBACK}
    />
  );
}

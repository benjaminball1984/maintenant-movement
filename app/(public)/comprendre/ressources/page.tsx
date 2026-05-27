import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import { LOREM_LONG } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ressources',
  description: 'Doctrine, textes de référence, kits militants, bibliographie politique.',
};

const FALLBACK = `Ressources pour s'organiser, comprendre, agir.

## Doctrine et textes fondateurs

${LOREM_LONG}

## Kits militants

- Modèle de procès-verbal d'assemblée
- Kit porte-à-porte
- Charte modération
- Guide cofondateurice commune libre

${LOREM_LONG}

## Bibliographie politique

${LOREM_LONG}
`;

export default function PageRessources() {
  return (
    <PageEditorialeCMS
      surtitre="Comprendre"
      titreParDefaut="Ressources"
      cle="page.comprendre.ressources"
      loremFallback={FALLBACK}
    />
  );
}

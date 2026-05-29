import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doctrine',
  description:
    'Doctrine fondatrice de Maintenant! : empouvoirement, équivalence, moindre violence, ancrage territorial, subsidiarité.',
};

/**
 * Page Doctrine fondatrice — migrée sur PageEditorialeCMS en V2.5.46
 * pour bénéficier du mode rich text (couleurs, polices, citations,
 * embeds vidéo) et de l'édition admin inline.
 *
 * Le contenu attendu (cf. CONTENUS-A-ARBITRER.md) : explication des
 * grands principes (empouvoirement vs captation, mouvement de service,
 * équivalence, moindre violence, ancrage territorial, subsidiarité,
 * populisme progressiste inclusif démocratique émancipateur). Citations
 * à mettre en avant : « Ce qui se fait pour les gens sans les gens se
 * fait contre les gens. » + « Chanter aujourd'hui, pas seulement
 * promettre demain. ».
 *
 * Tant que le contenu n'est pas saisi en base, le fallback ci-dessous
 * s'affiche (placeholder visible, conforme à la règle de non-invention
 * §3 du CLAUDE.md).
 */

const FALLBACK = `[TEXTE À FAIRE — doctrine fondatrice]

Contenu attendu : explication des grands principes (empouvoirement vs captation de pouvoir, mouvement de service au service de nous-mêmes, équivalence, moindre violence, légitimité d'expression par ancrage territorial réel, subsidiarité par accord mutuel, populisme progressiste inclusif démocratique émancipateur).

## Citations à mettre en avant

- « Ce qui se fait pour les gens sans les gens se fait contre les gens. »
- « Chanter aujourd'hui, pas seulement promettre demain. »

À rédiger par Lilou/Ben.`;

export default function PageDoctrine() {
  return (
    <PageEditorialeCMS
      surtitre="Comprendre"
      titreParDefaut="Doctrine fondatrice"
      cle="page.comprendre.doctrine"
      loremFallback={FALLBACK}
    />
  );
}

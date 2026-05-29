import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qui sommes-nous',
  description:
    'À propos du mouvement Maintenant!, histoire, doctrine générale, premiers signataires, structuration (cosec gé en collégial).',
};

/**
 * Page À propos — migrée sur PageEditorialeCMS en V2.5.46 pour
 * bénéficier du mode rich text (couleurs, polices, citations, embeds)
 * et de l'édition admin inline.
 *
 * Le contenu attendu (cf. CONTENUS-A-ARBITRER.md) : présentation du
 * mouvement Maintenant!, histoire, doctrine générale, premiers
 * signataires, structuration (cosec gé en collégial), liens vers
 * Doctrine et Commune libre. Citation à mettre en avant : « Le but
 * de la plateforme n'est pas que la plateforme fonctionne. »
 */

const FALLBACK = `[TEXTE À FAIRE — page À propos]

Contenu attendu : présentation du mouvement Maintenant!, histoire, doctrine générale, premiers signataires, structuration (cosec gé en collégial), liens vers Doctrine et Commune libre.

## Citation à mettre en avant

« Le but de la plateforme n'est pas que la plateforme fonctionne. »

À rédiger par Lilou/Ben.`;

export default function PageAPropos() {
  return (
    <PageEditorialeCMS
      surtitre="À propos"
      titreParDefaut="Qui sommes-nous"
      cle="page.a-propos"
      loremFallback={FALLBACK}
    />
  );
}

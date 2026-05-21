import { Alert, Container, Heading } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Réseau social',
  description: 'Flux Facebook-like sans pub, algorithme strictement transparent et hiérarchisé.',
};

/**
 * Page `/s-informer/reseau` — Réseau social (chantier 7.5).
 *
 * Cf. spec §4E. Chantier complet : flux + algo strict transparent
 * (soi → ami·es → contenus du site → entraide 5 %) + messagerie
 * interne + modération a posteriori + encart financement permanent.
 *
 * Le chantier 7.5 est volumineux (table `publication`, `relation_ami`,
 * `message_interne`, algorithme de flux, UI complexe). On le laisse en
 * stub explicite plutôt que de poser des bouts épars.
 */
export default function PageReseau() {
  return (
    <Container taille="md" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
        <Heading niveau={1}>Réseau social</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Flux Facebook-like sans publicité, sans pondération algorithmique cachée. Cf. doctrine
          §4E.
        </p>
      </header>

      <Alert variant="info" titre="Chantier en construction (7.5)">
        Le réseau social demande plusieurs tables nouvelles (`publication`, `relation_ami`,
        `message_interne`), un algorithme de flux strict (soi → ami·es → contenus du site → entraide
        5 %), une messagerie temps réel, et une couche de modération a posteriori. C'est un gros
        chantier qui sera livré dans une session dédiée.
        <ul className="ml-4 mt-2 list-disc text-sm">
          <li>Pas de publicité.</li>
          <li>Pas de pondération algorithmique cachée.</li>
          <li>Pas d'autoplay vidéo.</li>
          <li>Pas de captation d'attention.</li>
          <li>Modération a posteriori.</li>
          <li>Encart financement permanent visible (cagnotte de fonctionnement).</li>
        </ul>
        En attendant, les contenus du mouvement se trouvent dans{' '}
        <Link href="/s-informer/media" className="underline">
          Média Maintenant
        </Link>
        , les pétitions et mobilisations dans{' '}
        <Link href="/mobiliser" className="underline">
          Mobiliser
        </Link>
        .
      </Alert>
    </Container>
  );
}

import { Alert, Container, Heading } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Maintenant Médias — journal-affiche',
  description:
    'Édition locale d’un journal-affiche imprimable. 30 modèles Canva + agent Claude API + Paged.js + Puppeteer.',
};

/**
 * Page `/s-informer/journal` — Maintenant Médias (chantier 7.3).
 *
 * Cf. spec §4C. La feature complète demande :
 *   - 30 modèles Canva exportés en HTML/CSS.
 *   - Agent Claude (API) qui pioche les modules pertinents.
 *   - Paged.js + Puppeteer pour le PDF print-ready.
 *   - Stripe/T99CP pour les commandes d'impression à façon.
 *
 * Aucune de ces dépendances n'est posée dans le projet à ce stade.
 * On laisse cette page en stub explicite plutôt que d'inventer un
 * flux qui ne marchera pas. Le chantier 7.3 reprendra cette page
 * quand les modèles Canva auront été fournis et que les clés
 * Anthropic + Stripe seront branchées.
 */
export default function PageJournal() {
  return (
    <Container taille="md" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
        <Heading niveau={1}>Maintenant Médias (journal-affiche)</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Édition locale d'un journal-affiche imprimable. Patchwork de modules existants sur le site
          (articles, brèves, dessins, mobilisations, annonces). Format A3 ou A4 collable dans
          l'espace public.
        </p>
      </header>

      <Alert variant="info" titre="Feature en construction">
        L'architecture v1 est posée dans la doctrine §4C : 30 modèles Canva exportés en HTML/CSS +
        agent Claude API qui pioche les modules pertinents + Paged.js + Puppeteer pour le PDF
        print-ready. La feature sera livrée quand :
        <ul className="ml-4 mt-2 list-disc text-sm">
          <li>les 30 modèles Canva auront été fournis (équipe édito) ;</li>
          <li>les clés API Anthropic seront branchées (chantier 11.3) ;</li>
          <li>Stripe et T99CP seront en place pour les commandes d'impression à façon.</li>
        </ul>
        En attendant, les contenus s'écrivent dans{' '}
        <Link href="/s-informer/media" className="underline">
          Média Maintenant
        </Link>{' '}
        et seront recomposés ici lorsque l'outil sera ouvert.
      </Alert>

      <section className="mt-8 grid gap-3 rounded-md border border-border bg-surface-2 p-6 text-sm text-text-2">
        <Heading niveau={2} apparenceComme={4}>
          Modèle économique (rappel doctrine §4C)
        </Heading>
        <ul className="ml-4 list-disc space-y-1">
          <li>Impression locale gratuite.</li>
          <li>Impression à façon en T99CP ou en euros, marge mutualisée.</li>
          <li>Plafond à 100 affiches par commande.</li>
          <li>Coûts API estimés ~0,023 $ par affiche avec Claude Haiku 4.5.</li>
        </ul>
      </section>
    </Container>
  );
}

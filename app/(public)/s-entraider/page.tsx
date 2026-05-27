import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'S’entraider',
  description:
    "L'entraide concrète et économique entre les gens : hébergement, transport, prêt d'objets, alimentation, SEL, marché solidaire.",
};

const FALLBACK_TITRE = "S'entraider";
const FALLBACK_INTRO =
  "L'entraide concrète et économique entre les gens : hébergement, transport, prêt d'objets, alimentation, SEL (système d'échange local), marché solidaire, groupes d'entraide locaux.";

/**
 * Page d'accueil de l'espace S'entraider.
 *
 * V2.4 (refonte) : SEL et Marché solidaire sont désormais livrés, on
 * les ajoute en cartes à part entière en plus des sous-espaces config.
 * V2.4.105 : titre + intro éditables admin via CMS.
 */
export default async function PageSEntraider() {
  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('s-entraider.titre', { valeurMd: FALLBACK_TITRE }),
    lireContenuEditorial('s-entraider.intro', { valeurMd: FALLBACK_INTRO }),
  ]);

  return (
    <>
      <TexteEditableAdmin
        cle="s-entraider.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre de la page s-entraider"
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="s-entraider.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro de la page s-entraider"
        multilignes
        longueurMax={500}
      >
        {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
      </TexteEditableAdmin>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {Object.values(SOUS_ESPACES).map((config) => (
          <li key={config.type}>
            <Link
              href={`/s-entraider/${config.slug}`}
              className={cn(
                'block rounded-lg border border-border bg-surface p-4 transition',
                'hover:border-brand hover:bg-surface-2',
              )}
            >
              <p className="font-bold text-text-1">{config.titre}</p>
              <p className="mt-1 text-sm text-text-3">{config.description}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/s-entraider/sel"
            className={cn(
              'block rounded-lg border border-border bg-surface p-4 transition',
              'hover:border-brand hover:bg-surface-2',
            )}
          >
            <p className="font-bold text-text-1">SEL — Système d'échange local</p>
            <p className="mt-1 text-sm text-text-3">
              Échange de services entre membres. 1 T99CP = 1 € = 1 minute. Volontariat et services
              proposés/cherchés.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/s-entraider/marche"
            className={cn(
              'block rounded-lg border border-border bg-surface p-4 transition',
              'hover:border-brand hover:bg-surface-2',
            )}
          >
            <p className="font-bold text-text-1">Marché solidaire</p>
            <p className="mt-1 text-sm text-text-3">
              Produits, boutiques éphémères, mini-marchés physiques. Vente ou don gratuit. T99CP / €
              / G1 / MNLC.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/s-entraider/groupes-locaux"
            className={cn(
              'block rounded-lg border border-border bg-surface p-4 transition',
              'hover:border-brand hover:bg-surface-2',
            )}
          >
            <p className="font-bold text-text-1">Groupes d'entraide locaux</p>
            <p className="mt-1 text-sm text-text-3">
              Groupes locaux qui activent leurs propres outils (prêt, marché, SEL) sur leur
              territoire.
            </p>
          </Link>
        </li>
      </ul>

      <Alert variant="info" titre="Tout est gratuit et libre" className="mt-8">
        Les outils d'entraide sont accessibles à toute personne authentifiée, adhérente ou non. La
        modération a posteriori est assurée par l'équipe de modération.
      </Alert>
    </>
  );
}

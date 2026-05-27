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

// Titres des 3 cartes hors-config (vocabulaire fixe, restent en dur).
// Descriptions editables admin (cf. autres pages hub).
const CARTES_HORS_CONFIG: ReadonlyArray<{ slug: string; titre: string; fallback: string }> = [
  {
    slug: 'sel',
    titre: "SEL — Système d'échange local",
    fallback:
      'Échange de services entre membres. 1 T99CP = 1 € = 1 minute. Volontariat et services proposés/cherchés.',
  },
  {
    slug: 'marche',
    titre: 'Marché solidaire',
    fallback:
      'Produits, boutiques éphémères, mini-marchés physiques. Vente ou don gratuit. T99CP / € / G1 / MNLC.',
  },
  {
    slug: 'groupes-locaux',
    titre: "Groupes d'entraide locaux",
    fallback:
      'Groupes locaux qui activent leurs propres outils (prêt, marché, SEL) sur leur territoire.',
  },
];

const FALLBACK_ALERT_TITRE = 'Tout est gratuit et libre';
const FALLBACK_ALERT_CORPS =
  "Les outils d'entraide sont accessibles à toute personne authentifiée, adhérente ou non. La modération a posteriori est assurée par l'équipe de modération.";

/**
 * Page d'accueil de l'espace S'entraider.
 *
 * V2.4 (refonte) : SEL et Marché solidaire sont désormais livrés, on
 * les ajoute en cartes à part entière en plus des sous-espaces config.
 * V2.4.105 : titre + intro éditables admin via CMS.
 */
export default async function PageSEntraider() {
  // 1 + 2 textes hub + N descriptions cartes + 2 textes alert = tout lu en parallele.
  const sousEspacesConfig = Object.values(SOUS_ESPACES);

  const [estAdmin, titre, intro, alertTitre, alertCorps, ...descriptionsLues] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('s-entraider.titre', { valeurMd: FALLBACK_TITRE }),
    lireContenuEditorial('s-entraider.intro', { valeurMd: FALLBACK_INTRO }),
    lireContenuEditorial('s-entraider.alert.titre', { valeurMd: FALLBACK_ALERT_TITRE }),
    lireContenuEditorial('s-entraider.alert.corps', { valeurMd: FALLBACK_ALERT_CORPS }),
    ...sousEspacesConfig.map((config) =>
      lireContenuEditorial(`s-entraider.carte.${config.slug}.description`, {
        valeurMd: config.description,
      }),
    ),
    ...CARTES_HORS_CONFIG.map((c) =>
      lireContenuEditorial(`s-entraider.carte.${c.slug}.description`, {
        valeurMd: c.fallback,
      }),
    ),
  ]);

  // Decoupe le tableau de descriptions : d'abord les sous-espaces config, puis hors-config.
  const descriptionsConfig = descriptionsLues.slice(0, sousEspacesConfig.length);
  const descriptionsHorsConfig = descriptionsLues.slice(sousEspacesConfig.length);

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
        {sousEspacesConfig.map((config, i) => (
          <li key={config.type}>
            <Link
              href={`/s-entraider/${config.slug}`}
              className={cn(
                'block rounded-lg border border-border bg-surface p-4 transition',
                'hover:border-brand hover:bg-surface-2',
              )}
            >
              <p className="font-bold text-text-1">{config.titre}</p>
              <TexteEditableAdmin
                cle={`s-entraider.carte.${config.slug}.description`}
                valeurInitiale={descriptionsConfig[i]?.valeurMd ?? config.description}
                estAdmin={estAdmin}
                libelle={`description de la carte ${config.titre}`}
                multilignes
                longueurMax={400}
              >
                {(t) => <p className="mt-1 text-sm text-text-3">{t}</p>}
              </TexteEditableAdmin>
            </Link>
          </li>
        ))}
        {CARTES_HORS_CONFIG.map((carte, i) => (
          <li key={carte.slug}>
            <Link
              href={`/s-entraider/${carte.slug}`}
              className={cn(
                'block rounded-lg border border-border bg-surface p-4 transition',
                'hover:border-brand hover:bg-surface-2',
              )}
            >
              <p className="font-bold text-text-1">{carte.titre}</p>
              <TexteEditableAdmin
                cle={`s-entraider.carte.${carte.slug}.description`}
                valeurInitiale={descriptionsHorsConfig[i]?.valeurMd ?? carte.fallback}
                estAdmin={estAdmin}
                libelle={`description de la carte ${carte.titre}`}
                multilignes
                longueurMax={400}
              >
                {(t) => <p className="mt-1 text-sm text-text-3">{t}</p>}
              </TexteEditableAdmin>
            </Link>
          </li>
        ))}
      </ul>

      <Alert
        variant="info"
        titre={
          <TexteEditableAdmin
            cle="s-entraider.alert.titre"
            valeurInitiale={alertTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre de l'alerte bas de page s-entraider"
            longueurMax={80}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        }
        className="mt-8"
      >
        <TexteEditableAdmin
          cle="s-entraider.alert.corps"
          valeurInitiale={alertCorps.valeurMd}
          estAdmin={estAdmin}
          libelle="corps de l'alerte bas de page s-entraider"
          multilignes
          longueurMax={500}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Alert>
    </>
  );
}

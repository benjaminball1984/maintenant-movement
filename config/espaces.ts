/**
 * Les 5 espaces de Maintenant!.
 *
 * Source : `docs/specs/01_ARCHITECTURE.md §1 et §2`.
 *
 * Data pure (slugs, libellés, verbes, sous-espaces). **Aucun texte éditorial
 * inventé.** Les textes de présentation des espaces sont à rédiger par
 * Lilou/Ben au chantier 2.1 et arbitrés en MANIFEST sous « Contenus à
 * arbitrer ».
 *
 * Utilisé par : Header / Nav 5 espaces (chantier 2.1), router public.
 */
export interface SousEspace {
  /** Slug de l'URL (`/<espace>/<sous-espace>`). */
  slug: string;
  /** Libellé d'affichage exact (fixé en spec). */
  libelle: string;
}

export interface Espace {
  /** Slug racine de l'espace (`/<espace>`). */
  slug: string;
  /** Libellé d'affichage exact. */
  libelle: string;
  /** Verbe associé à l'espace. */
  verbe: string;
  /** Sous-espaces visibles dans la navigation. */
  sousEspaces: ReadonlyArray<SousEspace>;
}

export const ESPACES: ReadonlyArray<Espace> = [
  {
    slug: 's-informer',
    libelle: 'S’informer',
    verbe: 's’informer',
    sousEspaces: [
      { slug: 'media', libelle: 'Média Maintenant' },
      { slug: 'radio', libelle: 'Maintenant Radio' },
      { slug: 'journal', libelle: 'Maintenant Médias' },
      { slug: 'reseau', libelle: 'Réseau social' },
      { slug: 'sondages', libelle: 'Sondages' },
      { slug: 'decider', libelle: 'Décider' },
    ],
  },
  {
    slug: 'mobiliser',
    libelle: 'Mobiliser',
    verbe: 'mobiliser',
    sousEspaces: [
      { slug: 'petitions', libelle: 'Pétitions' },
      { slug: 'campagnes', libelle: 'Campagnes' },
      { slug: 'mobilisations', libelle: 'Mobilisations' },
      { slug: 'cagnottes', libelle: 'Cagnottes' },
    ],
  },
  {
    slug: 's-entraider',
    libelle: 'S’entraider',
    verbe: 's’entraider',
    sousEspaces: [
      { slug: 'hebergement', libelle: 'Hébergement solidaire' },
      { slug: 'transport', libelle: 'Transport solidaire' },
      { slug: 'qui-prete-tout', libelle: 'Qui prête tout' },
      { slug: 'fruits-de-la-terre', libelle: 'Fruits de la terre' },
      { slug: 'sel', libelle: 'SEL' },
      { slug: 'marche', libelle: 'Marché solidaire' },
    ],
  },
  {
    slug: 'agir',
    libelle: 'Agir',
    verbe: 'agir',
    sousEspaces: [
      { slug: 'adherer', libelle: 'Adhérer' },
      { slug: 'communes', libelle: 'Commune libre' },
      { slug: 'moments-solidaires', libelle: 'Moments solidaires' },
      { slug: 'autres-moyens', libelle: 'D’autres moyens d’agir' },
    ],
  },
  {
    slug: 'comprendre',
    libelle: 'Comprendre',
    verbe: 'comprendre',
    sousEspaces: [
      { slug: 'monnaie', libelle: 'Monnaie 99-coin' },
      { slug: 'doctrine', libelle: 'Doctrine' },
      { slug: 'faq', libelle: 'FAQ' },
      { slug: 'ressources', libelle: 'Ressources' },
    ],
  },
] as const;

/** Récupère un espace par son slug. Lance une erreur si introuvable. */
export function trouverEspace(slug: string): Espace {
  const espace = ESPACES.find((e) => e.slug === slug);
  if (espace === undefined) {
    throw new Error(`Espace inconnu : "${slug}".`);
  }
  return espace;
}

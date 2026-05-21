import type { TypeOffreEntraide } from '@/types/database';

/**
 * Configuration centralisée des 4 sous-espaces S'entraider (chantier 4.1).
 *
 * Permet de générer 4 pages quasi-identiques à partir d'une seule entrée
 * `<PageEntraide type={...} />` (cf. composants). Ajouter un sous-espace
 * = ajouter une ligne ici.
 */
export interface ConfigSousEspace {
  type: TypeOffreEntraide;
  slug: string;
  titre: string;
  description: string;
  /** Verbe d'offre (« j'héberge », « je prête »...) */
  verbeOffre: string;
  /** Verbe de demande (« je cherche un hébergement »...) */
  verbeDemande: string;
}

export const SOUS_ESPACES: Record<TypeOffreEntraide, ConfigSousEspace> = {
  hebergement: {
    type: 'hebergement',
    slug: 'hebergement',
    titre: 'Hébergement solidaire',
    description:
      'Fiches d’offre d’hébergement entre particulier·ères. Géolocalisé. Contact par email du créateur·ice (messagerie interne au chantier 7.5).',
    verbeOffre: "J'héberge",
    verbeDemande: 'Je cherche un hébergement',
  },
  transport: {
    type: 'transport',
    slug: 'transport',
    titre: 'Transport solidaire',
    description:
      'Covoiturage solidaire. Mise en relation simple, sans plateforme tierce. Géolocalisé.',
    verbeOffre: 'Je propose un trajet',
    verbeDemande: 'Je cherche un trajet',
  },
  pret_objet: {
    type: 'pret_objet',
    slug: 'qui-prete-tout',
    titre: 'Qui prête tout',
    description:
      "Prêt d'objets entre particulier·ères. Outils, équipements, livres. (Repair Café : sous-feature à venir.)",
    verbeOffre: 'Je prête',
    verbeDemande: 'Je cherche à emprunter',
  },
  fruits_terre: {
    type: 'fruits_terre',
    slug: 'fruits-de-la-terre',
    titre: 'Fruits de la terre',
    description:
      'Alimentation circuit court : surplus de récoltes, paniers, troc. (Frigos solidaires : sous-feature à venir.)',
    verbeOffre: "J'offre / je donne",
    verbeDemande: 'Je cherche à recevoir',
  },
};

export function configParSlug(slug: string): ConfigSousEspace | null {
  for (const config of Object.values(SOUS_ESPACES)) {
    if (config.slug === slug) return config;
  }
  return null;
}

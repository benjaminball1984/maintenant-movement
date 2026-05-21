import type { MonnaieMarcheMinimarche } from '@/types/database';

/**
 * Configuration centralisée du Marché solidaire (chantier 4.3).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §6F` : 3 onglets, 4 monnaies en
 * physique, 2 en ligne, frais 5 % EUR / 0 % T99CP, modération a
 * posteriori, notation 5 étoiles unilatérale.
 *
 * Ajouter une nouveauté = ajouter une ligne ici, pas refactor.
 */

// ============================================================
// 3 onglets du marché solidaire
// ============================================================

export type OngletMarche = 'produit' | 'boutique' | 'minimarche';

export interface ConfigOnglet {
  slug: OngletMarche;
  href: string;
  libelle: string;
  description: string;
}

export const ONGLETS_MARCHE: Record<OngletMarche, ConfigOnglet> = {
  produit: {
    slug: 'produit',
    href: '/s-entraider/marche/produits',
    libelle: 'Produit',
    description: 'Proposer ou chercher un objet (vente ou don gratuit).',
  },
  boutique: {
    slug: 'boutique',
    href: '/s-entraider/marche/boutiques',
    libelle: 'Boutique',
    description: 'Créer ou chercher une boutique éphémère.',
  },
  minimarche: {
    slug: 'minimarche',
    href: '/s-entraider/marche/minimarches',
    libelle: 'Minimarché',
    description: 'Conseils pour organiser un marché physique (4 monnaies).',
  },
};

export const LISTE_ONGLETS: ConfigOnglet[] = [
  ONGLETS_MARCHE.produit,
  ONGLETS_MARCHE.boutique,
  ONGLETS_MARCHE.minimarche,
];

// ============================================================
// Monnaies acceptées
// ============================================================

export interface ConfigMonnaie {
  code: MonnaieMarcheMinimarche;
  libelle: string;
  /** `true` si la monnaie est acceptée pour le commerce en ligne. */
  enLigne: boolean;
  /** Aide courte pour l'UI (badge tooltip). */
  aide: string;
}

/**
 * Catalogue des 4 monnaies acceptées en physique. Source : spec §6F.
 *
 * En ligne, seules T99CP et EUR sont activées (cf. spec « Pas de Ğ1 ni
 * monnaies locales en ligne (réservées au physique pour l'instant) »).
 */
export const MONNAIES: Record<MonnaieMarcheMinimarche, ConfigMonnaie> = {
  T99CP: {
    code: 'T99CP',
    libelle: '99-coin',
    enLigne: true,
    aide: 'Cryptomonnaie du mouvement. Frais 0 %, double affichage avec EUR.',
  },
  EUR: {
    code: 'EUR',
    libelle: 'Euros',
    enLigne: true,
    aide: 'Stripe Checkout. Frais plateforme 5 %.',
  },
  G1: {
    code: 'G1',
    libelle: 'Ğ1 (Jaune)',
    enLigne: false,
    aide: 'Monnaie libre Duniter. Acceptée en physique uniquement.',
  },
  MNLC: {
    code: 'MNLC',
    libelle: 'Monnaies locales',
    enLigne: false,
    aide: 'Sol-Violette, Eusko, Léman... Acceptées en physique uniquement.',
  },
};

export const MONNAIES_PHYSIQUES: MonnaieMarcheMinimarche[] = ['T99CP', 'EUR', 'G1', 'MNLC'];
export const MONNAIES_EN_LIGNE: MonnaieMarcheMinimarche[] = ['T99CP', 'EUR'];

// ============================================================
// Frais : on réexporte les helpers purs de `lib/payments/frais`
// (pattern « 5 % EUR / 0 % T99CP », cf. cagnottes chantier 3.3).
// On évite `@/lib/payments` (index) pour ne pas tirer le service de
// paiement côté client (qui dépend de `node:crypto`).
// ============================================================

export { calculerFraisEuros, calculerFraisT99CP } from '@/lib/payments/frais';

// ============================================================
// Helpers d'affichage
// ============================================================

/**
 * Affiche un montant en euros à partir d'une valeur en centimes,
 * format « 12,50 € ». Renvoie une chaîne vide si 0 ou invalide.
 */
export function formaterEuros(centimes: number | null | undefined): string {
  if (centimes === null || centimes === undefined || centimes <= 0) return '';
  const euros = centimes / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: euros % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Affiche un montant en T99CP en notation lisible (1 T99CP = 10^18
 * unités). Renvoie une chaîne vide si 0 ou invalide.
 *
 * Volontairement simple : on tronque les décimales au-delà de 4 pour
 * la lecture humaine. La valeur exacte reste dans le string brut.
 */
export function formaterT99CP(unites: string | null | undefined): string {
  if (unites === null || unites === undefined || unites === '' || unites === '0') return '';
  try {
    const valeur = BigInt(unites);
    if (valeur === 0n) return '';
    const PUISSANCE_T99CP = 10n ** 18n;
    const entier = valeur / PUISSANCE_T99CP;
    const reste = valeur % PUISSANCE_T99CP;
    if (reste === 0n) return `${entier.toString()} 99-coin`;
    const decimales = reste.toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
    const sep = decimales === '' ? '' : `,${decimales}`;
    return `${entier.toString()}${sep} 99-coin`;
  } catch {
    return '';
  }
}

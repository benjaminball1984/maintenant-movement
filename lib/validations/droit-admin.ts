import type { NiveauDroitAdmin } from '@/types/database';
import { z } from 'zod';

/**
 * Validation des droits d'administration (table `droit_admin`).
 *
 * Ces schémas pilotent la page de gestion des droits de la console
 * nationale. Ils reproduisent côté application les contraintes CHECK de la
 * migration 008, pour produire des messages clairs en français AVANT que
 * la base ne refuse l'insertion :
 *   - `scope_commune_id` n'est renseigné QUE pour le niveau `animation` ;
 *   - `perimetre_onglet` n'est renseigné QUE pour le niveau `moderation`
 *     (vide = tous les onglets).
 */

// ============================================================
// Onglets de la console de modération
// ============================================================

/**
 * Clés des onglets de modération, utilisées comme valeurs de
 * `perimetre_onglet`. Source de vérité unique partagée avec la nav de la
 * console (`app/admin/layout.tsx`) et les Server Actions de modération.
 */
export const ONGLETS_MODERATION = [
  'petitions',
  'campagnes',
  'mobilisations',
  'cagnottes',
  'media',
  'sel',
  'marche',
  'moments',
  'sondages',
  'autres_moyens',
] as const;

export type OngletModeration = (typeof ONGLETS_MODERATION)[number];

/** Libellés affichables des onglets de modération. */
export const LIBELLES_ONGLET: Record<OngletModeration, string> = {
  petitions: 'Pétitions',
  campagnes: 'Campagnes',
  mobilisations: 'Mobilisations',
  cagnottes: 'Cagnottes',
  media: 'Médias',
  sel: 'SEL',
  marche: 'Marché solidaire',
  moments: 'Moments',
  sondages: 'Sondages',
  autres_moyens: 'Autres moyens',
};

// ============================================================
// Niveaux de droit
// ============================================================

/** Description lisible de chaque niveau, pour l'UI de la console. */
export const NIVEAUX_DROIT: ReadonlyArray<{
  valeur: NiveauDroitAdmin;
  libelle: string;
  description: string;
}> = [
  {
    valeur: 'national',
    libelle: 'Admin national·e',
    description: 'Accès complet et journalisé à tout le mouvement.',
  },
  {
    valeur: 'admin',
    libelle: 'Administration générale',
    description: 'Gestion étendue des contenus, hors gestion des droits.',
  },
  {
    valeur: 'moderation',
    libelle: 'Modération',
    description: 'Console de modération, éventuellement limitée à certains onglets.',
  },
  {
    valeur: 'tresorerie',
    libelle: 'Trésorerie',
    description: 'Gestion financière : cagnottes, dons, reversements.',
  },
  {
    valeur: 'animation',
    libelle: 'Animation de commune',
    description: 'Animation d’une commune libre précise.',
  },
  {
    valeur: 'dpd',
    libelle: 'DPD',
    description: 'Délégué·e à la protection des données (RGPD), accès au journal d’audit.',
  },
];

/** Libellé court d'un niveau, pour les badges et tableaux. */
export function libelleNiveau(niveau: NiveauDroitAdmin): string {
  return NIVEAUX_DROIT.find((n) => n.valeur === niveau)?.libelle ?? niveau;
}

// ============================================================
// Schémas Zod
// ============================================================

/** Liste des niveaux acceptés, dérivée de `NIVEAUX_DROIT` (source unique). */
const niveauxAcceptes = NIVEAUX_DROIT.map((n) => n.valeur) as [
  NiveauDroitAdmin,
  ...NiveauDroitAdmin[],
];

/**
 * Schéma d'attribution d'un droit. Les contraintes croisées (commune
 * obligatoire pour l'animation, onglets réservés à la modération) sont
 * vérifiées dans le `superRefine` pour coller exactement aux CHECK SQL.
 */
export const accorderDroitSchema = z
  .object({
    personne_id: z.string().uuid('Personne invalide.'),
    niveau: z.enum(niveauxAcceptes),
    perimetre_onglet: z.array(z.enum(ONGLETS_MODERATION)).optional(),
    scope_commune_id: z.string().uuid('Commune invalide.').optional().nullable(),
  })
  .superRefine((valeurs, ctx) => {
    if (valeurs.niveau === 'animation' && !valeurs.scope_commune_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scope_commune_id'],
        message: 'Une commune est requise pour un droit d’animation.',
      });
    }
    if (valeurs.niveau !== 'animation' && valeurs.scope_commune_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scope_commune_id'],
        message: 'Seul un droit d’animation cible une commune.',
      });
    }
    if (
      valeurs.niveau !== 'moderation' &&
      valeurs.perimetre_onglet !== undefined &&
      valeurs.perimetre_onglet.length > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['perimetre_onglet'],
        message: 'Un périmètre d’onglets ne s’applique qu’à la modération.',
      });
    }
  });

export type DonneesAccorderDroit = z.infer<typeof accorderDroitSchema>;

/** Schéma de retrait d'un droit (on retire par identifiant de ligne). */
export const retirerDroitSchema = z.object({
  droit_id: z.string().uuid('Droit invalide.'),
});

export type DonneesRetirerDroit = z.infer<typeof retirerDroitSchema>;

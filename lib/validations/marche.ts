import { z } from 'zod';
import { tokenTurnstileSchema } from './auth';

/**
 * Validations Zod du sous-espace Marché solidaire (chantier 4.3).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §6F` :
 *   - 3 onglets : Produit / Boutique / Minimarché.
 *   - Toggle vente/don sur le même formulaire produit.
 *   - 4 monnaies en physique (T99CP, EUR, Ğ1, MNLC). 2 en ligne (T99CP, EUR).
 *   - Frais 5 % EUR, 0 % T99CP.
 *   - Retrait main propre OU envoi postal (port à la charge acheteureuse).
 *   - Notation 5 étoiles unilatérale acheteureuse → vendeureuse.
 */

// ============================================================
// Helpers communs
// ============================================================

/**
 * Schéma de prix T99CP : string représentant un bigint en plus petite
 * unité (équivalent wei). Cohérent avec le don T99CP (cf. cagnotte.ts).
 * `'0'` est autorisé (sentinel « pas de prix dans cette monnaie »).
 */
const prixT99CPSchema = z
  .string()
  .regex(/^\d+$/, 'Montant T99CP invalide.')
  .refine((v) => {
    try {
      return BigInt(v) <= 10n ** 27n;
    } catch {
      return false;
    }
  }, 'Montant T99CP déraisonnable.');

/** Cohérence : lat/lng vont ensemble ou pas du tout. */
function refineGeo<T extends { latitude?: number | null; longitude?: number | null }>(
  d: T,
): boolean {
  const aLat = d.latitude !== null && d.latitude !== undefined;
  const aLng = d.longitude !== null && d.longitude !== undefined;
  return aLat === aLng;
}

// ============================================================
// Onglet 1 — Création d'un produit
// ============================================================

/**
 * Création d'un produit (vente ou don) du marché solidaire.
 *
 * Le toggle `mode` détermine la cohérence des prix :
 *   - `don`   → prix obligatoirement à 0 (EUR et T99CP).
 *   - `vente` → au moins un prix > 0 (EUR ou T99CP).
 *
 * La contrainte est aussi enforced en BDD via CHECK
 * `produit_marche_prix_coherent`.
 */
export const creerProduitMarcheSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(5, 'Le titre doit comporter au moins 5 caractères.')
      .max(200, 'Le titre doit faire 200 caractères maximum.'),
    description: z
      .string()
      .trim()
      .min(30, 'La description doit comporter au moins 30 caractères.')
      .max(3000, 'La description doit faire 3000 caractères maximum.'),
    mode: z.enum(['vente', 'don']),
    /**
     * Prix en EUR, exprimé en centimes (entier). 0 = pas de prix EUR.
     */
    prix_euros_centimes: z
      .number()
      .int('Le prix doit être un nombre entier de centimes.')
      .min(0, 'Le prix ne peut pas être négatif.')
      .max(1_000_000_00, 'Prix maximum : 1 000 000 € en une transaction.'),
    /**
     * Prix en T99CP, plus petite unité, string bigint-safe. '0' = pas
     * de prix T99CP.
     */
    prix_t99cp_unites: prixT99CPSchema,
    categorie_slug: z
      .string()
      .trim()
      .max(60)
      .regex(/^[a-z0-9-]+$/, 'Slug de catégorie invalide.')
      .optional()
      .or(z.literal('')),
    image_url: z.string().url("URL d'image invalide.").optional().or(z.literal('')),
    lieu: z
      .string()
      .trim()
      .min(3, 'Le lieu de retrait est requis.')
      .max(200, 'Le lieu doit faire 200 caractères maximum.'),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    remise_main_propre: z.boolean(),
    envoi_postal: z.boolean(),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict()
  .refine(refineGeo, {
    message: 'Latitude et longitude doivent être fournies ensemble.',
    path: ['latitude'],
  })
  .refine((d) => d.remise_main_propre === true || d.envoi_postal === true, {
    message: 'Au moins un mode de retrait doit être sélectionné.',
    path: ['remise_main_propre'],
  })
  .refine(
    (d) => {
      if (d.mode === 'don') {
        return d.prix_euros_centimes === 0 && d.prix_t99cp_unites === '0';
      }
      // vente : au moins un prix > 0
      const aEur = d.prix_euros_centimes > 0;
      let aT99CP = false;
      try {
        aT99CP = BigInt(d.prix_t99cp_unites) > 0n;
      } catch {
        aT99CP = false;
      }
      return aEur || aT99CP;
    },
    {
      message:
        'En mode vente, indique un prix en euros et/ou en T99CP. En mode don, laisse les prix à 0.',
      path: ['prix_euros_centimes'],
    },
  );

export type DonneesCreerProduitMarche = z.infer<typeof creerProduitMarcheSchema>;

// ============================================================
// Retrait / clôture / marquer vendu
// ============================================================

export const retirerProduitSchema = z
  .object({
    produit_id: z.string().uuid(),
    raison: z
      .string()
      .trim()
      .min(5, 'Indique brièvement la raison.')
      .max(500, '500 caractères maximum.'),
  })
  .strict();

export type DonneesRetirerProduit = z.infer<typeof retirerProduitSchema>;

/**
 * Marque un produit comme vendu (= ouvre la possibilité de notation
 * unilatérale). La Server Action vérifie que l'auteurice de l'appel
 * est bien la vendeureuse.
 *
 * `acheteureuse_id` est requis car la notation est liée au couple
 * (produit, acheteureuse) ; le marquer vendu déclare publiquement à
 * qui le produit a été vendu.
 */
export const marquerVenduSchema = z
  .object({
    produit_id: z.string().uuid(),
    acheteureuse_id: z.string().uuid('Identifiant d’acheteureuse invalide.'),
  })
  .strict();

export type DonneesMarquerVendu = z.infer<typeof marquerVenduSchema>;

// ============================================================
// Notation 5 étoiles unilatérale
// ============================================================

export const noterVendeureuseSchema = z
  .object({
    produit_id: z.string().uuid(),
    /** 1 à 5 étoiles entiers. */
    etoiles: z
      .number()
      .int('Le nombre d’étoiles doit être un entier.')
      .min(1, 'Minimum 1 étoile.')
      .max(5, 'Maximum 5 étoiles.'),
    commentaire: z
      .string()
      .trim()
      .max(1000, '1000 caractères maximum.')
      .optional()
      .or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesNoterVendeureuse = z.infer<typeof noterVendeureuseSchema>;

// ============================================================
// Onglet 2 — Création d'une boutique éphémère
// ============================================================

export const creerBoutiqueSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(3, 'Le nom doit comporter au moins 3 caractères.')
      .max(200, '200 caractères maximum.'),
    description: z
      .string()
      .trim()
      .min(30, 'La description doit comporter au moins 30 caractères.')
      .max(3000, '3000 caractères maximum.'),
    sens: z.enum(['propose', 'cherche']),
    image_url: z.string().url("URL d'image invalide.").optional().or(z.literal('')),
    /**
     * Plage temporelle de la boutique éphémère. Si une seule des deux
     * dates est renseignée, on rejette (ambiguïté).
     */
    ouverte_du: z
      .string()
      .datetime({ message: 'Date de début invalide (ISO 8601).' })
      .optional()
      .or(z.literal('')),
    ouverte_au: z
      .string()
      .datetime({ message: 'Date de fin invalide (ISO 8601).' })
      .optional()
      .or(z.literal('')),
    lieu: z.string().trim().max(200).optional().or(z.literal('')),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict()
  .refine(refineGeo, {
    message: 'Latitude et longitude doivent être fournies ensemble.',
    path: ['latitude'],
  })
  .refine(
    (d) => {
      const a = d.ouverte_du !== undefined && d.ouverte_du !== '';
      const b = d.ouverte_au !== undefined && d.ouverte_au !== '';
      if (a !== b) return false;
      if (a && b) {
        return new Date(d.ouverte_du as string) <= new Date(d.ouverte_au as string);
      }
      return true;
    },
    {
      message:
        'Les dates d’ouverture doivent aller ensemble et la date de début doit précéder la fin.',
      path: ['ouverte_du'],
    },
  );

export type DonneesCreerBoutique = z.infer<typeof creerBoutiqueSchema>;

// ============================================================
// Onglet 3 — Création d'un minimarché solidaire
// ============================================================

/** Catalogue strict des monnaies physiques (cf. spec §6F). */
const monnaieMinimarcheSchema = z.enum(['T99CP', 'EUR', 'G1', 'MNLC']);

export const creerMinimarcheSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(5, 'Le titre doit comporter au moins 5 caractères.')
      .max(200, '200 caractères maximum.'),
    description: z
      .string()
      .trim()
      .min(30, 'La description doit comporter au moins 30 caractères.')
      .max(3000, '3000 caractères maximum.'),
    image_url: z.string().url("URL d'image invalide.").optional().or(z.literal('')),
    lieu: z.string().trim().min(3, 'Le lieu est requis.').max(200),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    commence_le: z.string().datetime({ message: 'Date de début invalide (ISO 8601).' }),
    termine_le: z.string().datetime({ message: 'Date de fin invalide (ISO 8601).' }),
    /**
     * Tableau des monnaies acceptées. Au moins une, parmi les 4 du
     * catalogue (T99CP, EUR, Ğ1, MNLC). Dédupliqué côté serveur.
     */
    monnaies_acceptees: z
      .array(monnaieMinimarcheSchema)
      .min(1, 'Au moins une monnaie doit être acceptée.')
      .max(4, 'Catalogue limité à 4 monnaies (T99CP, EUR, Ğ1, MNLC).'),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict()
  .refine(refineGeo, {
    message: 'Latitude et longitude doivent être fournies ensemble.',
    path: ['latitude'],
  })
  .refine((d) => new Date(d.commence_le) <= new Date(d.termine_le), {
    message: 'La date de fin doit suivre la date de début.',
    path: ['termine_le'],
  });

export type DonneesCreerMinimarche = z.infer<typeof creerMinimarcheSchema>;

// ============================================================
// Rattachement produit ↔ boutique
// ============================================================

export const rattacherProduitBoutiqueSchema = z
  .object({
    produit_id: z.string().uuid(),
    boutique_id: z.string().uuid(),
  })
  .strict();

export type DonneesRattacherProduitBoutique = z.infer<typeof rattacherProduitBoutiqueSchema>;

// ============================================================
// Achat en ligne (Stripe Checkout mock + T99CP)
// ============================================================

/**
 * Initiation d'un achat en ligne. La Server Action choisit le service
 * de paiement selon `monnaie` (Stripe mock pour EUR, T99CP service
 * pour T99CP) et passe le produit au statut `reserve` jusqu'à
 * confirmation côté webhook (3.3 patterns).
 */
export const acheterProduitSchema = z
  .object({
    produit_id: z.string().uuid(),
    monnaie: z.enum(['EUR', 'T99CP']),
    /**
     * `tx_hash` requis seulement pour T99CP (signature wallet). Pour
     * EUR, le PaymentIntent est généré côté Server Action.
     */
    tx_hash: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, 'tx_hash invalide (format 0x + 64 hex attendus).')
      .optional()
      .or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict()
  .refine((d) => d.monnaie !== 'T99CP' || (d.tx_hash !== undefined && d.tx_hash !== ''), {
    message: 'tx_hash requis pour un achat en T99CP.',
    path: ['tx_hash'],
  });

export type DonneesAcheterProduit = z.infer<typeof acheterProduitSchema>;

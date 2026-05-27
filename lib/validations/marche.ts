import {
  MESSAGES_VALIDATION_MARCHE_DEFAUT,
  type MessagesValidationMarche,
} from '@/lib/messages-validation';
import { z } from 'zod';

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
function prixT99CPFactory(messages: MessagesValidationMarche) {
  return z
    .string()
    .regex(/^\d+$/, messages.t99cpMontantFormat)
    .refine((v) => {
      try {
        return BigInt(v) <= 10n ** 27n;
      } catch {
        return false;
      }
    }, messages.t99cpMontantMax);
}

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

export function creerProduitMarcheFactory(
  messages: MessagesValidationMarche = MESSAGES_VALIDATION_MARCHE_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      description: z
        .string()
        .trim()
        .min(30, messages.descriptionMin)
        .max(3000, messages.descriptionMax),
      mode: z.enum(['vente', 'don']),
      prix_euros_centimes: z
        .number()
        .int(messages.prixEurosEntier)
        .min(0, messages.prixEurosMin)
        .max(1_000_000_00, messages.prixEurosMax),
      prix_t99cp_unites: prixT99CPFactory(messages),
      categorie_slug: z
        .string()
        .trim()
        .max(60)
        .regex(/^[a-z0-9-]+$/, messages.categorieSlugInvalide)
        .optional()
        .or(z.literal('')),
      image_url: z.string().url(messages.imageUrl).optional().or(z.literal('')),
      lieu: z.string().trim().min(3, messages.lieuRequis).max(200, messages.lieuMax),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      remise_main_propre: z.boolean(),
      envoi_postal: z.boolean(),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict()
    .refine(refineGeo, {
      message: messages.latLngEnsemble,
      path: ['latitude'],
    })
    .refine((d) => d.remise_main_propre === true || d.envoi_postal === true, {
      message: messages.retraitChoix,
      path: ['remise_main_propre'],
    })
    .refine(
      (d) => {
        if (d.mode === 'don') {
          return d.prix_euros_centimes === 0 && d.prix_t99cp_unites === '0';
        }
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
        message: messages.modeCoherent,
        path: ['prix_euros_centimes'],
      },
    );
}
export const creerProduitMarcheSchema = creerProduitMarcheFactory();

export type DonneesCreerProduitMarche = z.infer<typeof creerProduitMarcheSchema>;

// ============================================================
// Retrait / clôture / marquer vendu
// ============================================================

export function creerRetirerProduitSchema(
  messages: MessagesValidationMarche = MESSAGES_VALIDATION_MARCHE_DEFAUT,
) {
  return z
    .object({
      produit_id: z.string().uuid(),
      raison: z
        .string()
        .trim()
        .min(5, messages.retraitRaisonMin)
        .max(500, messages.retraitRaisonMax),
    })
    .strict();
}
export const retirerProduitSchema = creerRetirerProduitSchema();

export type DonneesRetirerProduit = z.infer<typeof retirerProduitSchema>;

export function creerMarquerVenduSchema(
  messages: MessagesValidationMarche = MESSAGES_VALIDATION_MARCHE_DEFAUT,
) {
  return z
    .object({
      produit_id: z.string().uuid(),
      acheteureuse_id: z.string().uuid(messages.acheteureuseUuid),
    })
    .strict();
}
export const marquerVenduSchema = creerMarquerVenduSchema();

export type DonneesMarquerVendu = z.infer<typeof marquerVenduSchema>;

// ============================================================
// Notation 5 étoiles unilatérale
// ============================================================

export function creerNoterVendeureuseSchema(
  messages: MessagesValidationMarche = MESSAGES_VALIDATION_MARCHE_DEFAUT,
) {
  return z
    .object({
      produit_id: z.string().uuid(),
      etoiles: z
        .number()
        .int(messages.etoilesEntier)
        .min(1, messages.etoilesMin)
        .max(5, messages.etoilesMax),
      commentaire: z
        .string()
        .trim()
        .max(1000, messages.commentaireMax)
        .optional()
        .or(z.literal('')),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const noterVendeureuseSchema = creerNoterVendeureuseSchema();

export type DonneesNoterVendeureuse = z.infer<typeof noterVendeureuseSchema>;

// ============================================================
// Onglet 2 — Création d'une boutique éphémère
// ============================================================

export function creerBoutiqueFactory(
  messages: MessagesValidationMarche = MESSAGES_VALIDATION_MARCHE_DEFAUT,
) {
  return z
    .object({
      nom: z.string().trim().min(3, messages.nomMin).max(200, messages.nomMax),
      description: z
        .string()
        .trim()
        .min(30, messages.descriptionMin)
        .max(3000, messages.descriptionMax),
      sens: z.enum(['propose', 'cherche']),
      image_url: z.string().url(messages.imageUrl).optional().or(z.literal('')),
      ouverte_du: z
        .string()
        .datetime({ message: messages.ouverteDuFormat })
        .optional()
        .or(z.literal('')),
      ouverte_au: z
        .string()
        .datetime({ message: messages.ouverteAuFormat })
        .optional()
        .or(z.literal('')),
      lieu: z.string().trim().max(200).optional().or(z.literal('')),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict()
    .refine(refineGeo, {
      message: messages.latLngEnsemble,
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
        message: messages.ouvertureCoherente,
        path: ['ouverte_du'],
      },
    );
}
export const creerBoutiqueSchema = creerBoutiqueFactory();

export type DonneesCreerBoutique = z.infer<typeof creerBoutiqueSchema>;

// ============================================================
// Onglet 3 — Création d'un minimarché solidaire
// ============================================================

/** Catalogue strict des monnaies physiques (cf. spec §6F). */
const monnaieMinimarcheSchema = z.enum(['T99CP', 'EUR', 'G1', 'MNLC']);

export function creerMinimarcheFactory(
  messages: MessagesValidationMarche = MESSAGES_VALIDATION_MARCHE_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.nomMax),
      description: z
        .string()
        .trim()
        .min(30, messages.descriptionMin)
        .max(3000, messages.descriptionMax),
      image_url: z.string().url(messages.imageUrl).optional().or(z.literal('')),
      lieu: z.string().trim().min(3, messages.lieuRequis).max(200),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      commence_le: z.string().datetime({ message: messages.commenceLeFormat }),
      termine_le: z.string().datetime({ message: messages.termineLeFormat }),
      monnaies_acceptees: z
        .array(monnaieMinimarcheSchema)
        .min(1, messages.monnaieMin)
        .max(4, messages.monnaieMax),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict()
    .refine(refineGeo, {
      message: messages.latLngEnsemble,
      path: ['latitude'],
    })
    .refine((d) => new Date(d.commence_le) <= new Date(d.termine_le), {
      message: messages.dateCoherence,
      path: ['termine_le'],
    });
}
export const creerMinimarcheSchema = creerMinimarcheFactory();

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

export function creerAcheterProduitSchema(
  messages: MessagesValidationMarche = MESSAGES_VALIDATION_MARCHE_DEFAUT,
) {
  return z
    .object({
      produit_id: z.string().uuid(),
      monnaie: z.enum(['EUR', 'T99CP']),
      tx_hash: z
        .string()
        .regex(/^0x[a-fA-F0-9]{64}$/, messages.txHashFormat)
        .optional()
        .or(z.literal('')),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict()
    .refine((d) => d.monnaie !== 'T99CP' || (d.tx_hash !== undefined && d.tx_hash !== ''), {
      message: messages.txHashRequisT99CP,
      path: ['tx_hash'],
    });
}
export const acheterProduitSchema = creerAcheterProduitSchema();

export type DonneesAcheterProduit = z.infer<typeof acheterProduitSchema>;

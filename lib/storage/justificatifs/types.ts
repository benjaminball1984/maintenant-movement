/**
 * Contrats de l'adapter Justificatif Storage (cycle V2 V2.3.32).
 *
 * Symétrique de `lib/storage/types.ts` (images), mais pour les
 * justificatifs de transactions sortantes (D12bis). Doctrine V2 : tout
 * reversement exige une pièce justificative obligatoire (refus
 * d'insertion sans).
 *
 * Pattern adapter cohérent : interface unique, impl Mock (Data URL en
 * mémoire) + impl Supabase (bucket `justificatifs` privé).
 *
 * Variable d'env : `JUSTIFICATIF_STORAGE_PROVIDER` (`mock` par défaut,
 * `supabase` en prod). Le bucket `justificatifs` côté Supabase doit
 * être créé MANUELLEMENT via le Dashboard (privé, RLS) — pas de
 * migration SQL pour le storage.
 */

/**
 * Types MIME acceptés pour un justificatif. PDF + images (un scan rapide
 * de facture sur téléphone est acceptable).
 */
export const MIME_JUSTIFICATIF_AUTORISES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type MimeJustificatif = (typeof MIME_JUSTIFICATIF_AUTORISES)[number];

/** Taille maximale d'un justificatif : 10 Mo (plus large que les images). */
export const TAILLE_MAX_JUSTIFICATIF_OCTETS = 10 * 1024 * 1024;

/**
 * Résultat du téléversement d'un justificatif. Discriminé `ok`.
 *
 * `cheminBucket` est l'identifiant interne à stocker dans
 * `transaction_sortante.justificatif_storage_path`. `urlSignee` est une
 * URL temporaire (60s) pour vérifier le téléversement côté client ; en
 * production, le téléchargement vrai passe par une Server Action qui
 * regénère une URL signée à la demande.
 */
export type ResultatTeleversementJustificatif =
  | {
      ok: true;
      cheminBucket: string;
      urlSignee: string;
      mimeType: MimeJustificatif;
      nomOriginal: string;
      taille: number;
    }
  | { ok: false; message: string };

export interface JustificatifStorageService {
  /**
   * Téléverse un justificatif. Retourne le chemin interne (à stocker en
   * BDD) + une URL signée temporaire (à afficher au client comme
   * confirmation visuelle).
   *
   * @param fichier - le `File` envoyé par le navigateur.
   * @param prefixeChemin - préfixe optionnel pour ranger par contexte
   *   (ex. `transactions/{caisseId}` regroupe tous les justificatifs
   *   d'une caisse).
   */
  televerser(fichier: File, prefixeChemin?: string): Promise<ResultatTeleversementJustificatif>;

  /**
   * Génère une URL signée temporaire pour télécharger un justificatif
   * existant. Côté admin uniquement (validation paiement, audit).
   *
   * @param cheminBucket - identifiant retourné par `televerser`.
   * @param dureeSec - durée de validité (défaut 60s).
   */
  obtenirUrlSignee(cheminBucket: string, dureeSec?: number): Promise<string | null>;

  /**
   * Supprime un justificatif. Idempotent.
   */
  supprimer(cheminBucket: string): Promise<{ ok: boolean }>;
}

export function estMimeJustificatifAutorise(mime: string): mime is MimeJustificatif {
  return (MIME_JUSTIFICATIF_AUTORISES as readonly string[]).includes(mime);
}

export function formaterTailleJustificatif(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

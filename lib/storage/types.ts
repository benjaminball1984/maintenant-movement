/**
 * Contrats de l'adapter Image Storage (cycle V2, exigence ET2).
 *
 * Pattern d'adapter cohérent avec les autres services externes du repo
 * (`lib/email/`, `lib/payments/`, `lib/livekit/`, `lib/t99cp/`,
 * `lib/turnstile/`) : on déclare ici l'interface, puis on fournit :
 *
 * - une implémentation `Mock` qui fonctionne SANS aucune dépendance externe
 *   (utilise des data URL en mémoire, idéal pour le dev et les tests),
 * - une implémentation `Supabase` qui pousse vers le Storage Supabase
 *   (`bucket = 'media'`, à provisionner par la migration de V2.0.3),
 * - une factory `index.ts` qui choisit selon `IMAGE_STORAGE_PROVIDER`
 *   (`mock` par défaut, `supabase` en prod).
 *
 * Conséquence : tout chantier qui a besoin d'uploader une image (réseau
 * social, éditeur de pétition, marché, espace membre, etc.) appelle
 * `getImageStorageService().televerser(...)` et ne se préoccupe pas de
 * la cible. Le jour où on branche un autre Storage, on ajoute un adapter.
 */

/**
 * Sémantique du rôle de l'image dans l'UI. Permet à l'adapter (Supabase
 * notamment) d'organiser le bucket, et au composant `TeleverseurImage` de
 * choisir les contraintes de taille / redimensionnement adaptées.
 */
export type RoleImage = 'couverture' | 'vignette' | 'icone';

/**
 * Tous les rôles connus, utile pour itérer dans une UI d'admin éventuelle.
 */
export const ROLES_IMAGE: readonly RoleImage[] = ['couverture', 'vignette', 'icone'];

/**
 * Types MIME acceptés pour un téléversement. La liste blanche est stricte :
 * tout ce qui n'y figure pas est refusé côté client ET côté serveur.
 *
 * Note : `file.type` côté navigateur n'est pas autoritatif. La vérification
 * définitive du type réel (signature de fichier) est faite par le bucket
 * Supabase Storage configuré avec `allowed_mime_types` (cf. migration).
 */
export const MIME_AUTORISES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type MimeAutorise = (typeof MIME_AUTORISES)[number];

/**
 * Taille maximale d'un fichier téléversé, en octets (5 Mo).
 * Doit rester cohérente avec la limite côté bucket Supabase (cf. migration).
 */
export const TAILLE_MAX_OCTETS = 5 * 1024 * 1024;

/**
 * Résultat du téléversement, type discriminé `ok` pour faciliter l'usage
 * dans les Server Actions (cf. convention `{ ok, ... } | { ok: false, message }`).
 */
export type ResultatTeleversement =
  | {
      ok: true;
      /** URL publique servable côté navigateur. */
      url: string;
      /**
       * Chemin interne dans le bucket. À conserver côté BDD pour pouvoir
       * supprimer l'image plus tard (`supprimer(cheminBucket)`).
       */
      cheminBucket: string;
    }
  | { ok: false; message: string };

/**
 * Contrat unique de l'adapter.
 */
export interface ImageStorageService {
  /**
   * Téléverse un fichier image et renvoie son URL publique + l'identifiant
   * interne du fichier dans le bucket.
   *
   * @param fichier - Le `File` envoyé par le navigateur.
   * @param role - La sémantique d'usage (couverture / vignette / icône).
   * @param prefixeChemin - Préfixe optionnel pour ranger les fichiers par
   *   contexte. Ex : `'petitions/abcd'` regroupe toutes les images liées à
   *   la pétition `abcd`. Si absent, on range par rôle uniquement.
   */
  televerser(
    fichier: File,
    role: RoleImage,
    prefixeChemin?: string,
  ): Promise<ResultatTeleversement>;

  /**
   * Supprime un fichier précédemment téléversé. Idempotent : ne renvoie pas
   * d'erreur si le fichier n'existe pas. Renvoie `{ ok: false }` uniquement
   * en cas de problème côté infrastructure (réseau, droits).
   */
  supprimer(cheminBucket: string): Promise<{ ok: boolean }>;
}

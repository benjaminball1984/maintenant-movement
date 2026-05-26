import { MockImageStorage } from './MockImageStorage';
import { SupabaseImageStorage } from './SupabaseImageStorage';
import type { ImageStorageService } from './types';

/**
 * Factory de l'adapter Image Storage.
 *
 * Lit `IMAGE_STORAGE_PROVIDER` :
 * - `mock` (défaut) → `MockImageStorage`, fonctionne sans Supabase Storage.
 * - `supabase` → `SupabaseImageStorage`, nécessite que le bucket `media`
 *   ait été provisionné par la migration `20260526220000_storage_media_bucket.sql`.
 *
 * Cohérent avec les autres factories du repo (`lib/email/`, `lib/payments/`,
 * etc.) : le site fonctionne 100 % en local sans aucune clé API.
 */
export function getImageStorageService(): ImageStorageService {
  const provider = process.env.IMAGE_STORAGE_PROVIDER ?? 'mock';
  switch (provider) {
    case 'mock':
      return new MockImageStorage();
    case 'supabase':
      return new SupabaseImageStorage();
    default:
      throw new Error(
        `IMAGE_STORAGE_PROVIDER inconnu : "${provider}". Valeurs attendues : "mock" | "supabase".`,
      );
  }
}

export type {
  ImageStorageService,
  ResultatTeleversement,
  RoleImage,
} from './types';
export { MIME_AUTORISES, ROLES_IMAGE, TAILLE_MAX_OCTETS } from './types';

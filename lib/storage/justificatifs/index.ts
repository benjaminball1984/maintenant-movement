import { MockJustificatifStorage } from './MockJustificatifStorage';
import { SupabaseJustificatifStorage } from './SupabaseJustificatifStorage';
import type { JustificatifStorageService } from './types';

/**
 * Factory de l'adapter Justificatif Storage (V2.3.32).
 *
 * Lit `JUSTIFICATIF_STORAGE_PROVIDER` :
 * - `mock` (défaut) → `MockJustificatifStorage`, fonctionne offline.
 * - `supabase` → `SupabaseJustificatifStorage`, nécessite la création
 *   du bucket `justificatifs` côté Supabase Dashboard (privé, RLS).
 */
export function getJustificatifStorageService(): JustificatifStorageService {
  const provider = process.env.JUSTIFICATIF_STORAGE_PROVIDER ?? 'mock';
  switch (provider) {
    case 'mock':
      return new MockJustificatifStorage();
    case 'supabase':
      return new SupabaseJustificatifStorage();
    default:
      throw new Error(
        `JUSTIFICATIF_STORAGE_PROVIDER inconnu : "${provider}". Valeurs : "mock" | "supabase".`,
      );
  }
}

export type {
  JustificatifStorageService,
  MimeJustificatif,
  ResultatTeleversementJustificatif,
} from './types';
export {
  MIME_JUSTIFICATIF_AUTORISES,
  TAILLE_MAX_JUSTIFICATIF_OCTETS,
  estMimeJustificatifAutorise,
  formaterTailleJustificatif,
} from './types';

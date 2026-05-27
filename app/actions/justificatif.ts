'use server';

import { getJustificatifStorageService } from '@/lib/storage/justificatifs';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Server Action de téléversement d'un justificatif (cycle V2 V2.3.32).
 *
 * Réservée aux admins nationaux (ou trésorier·ière·s cooptés, à
 * brancher quand le droit V2.1.3 sera là). La vérification est faite ici
 * pour éviter l'usage public depuis n'importe quel formulaire.
 *
 * Délègue à `getJustificatifStorageService()` qui choisit mock ou Supabase.
 *
 * Le caller (composant `ChampDocument`) reçoit `cheminBucket` à stocker
 * en BDD dans `transaction_sortante.justificatif_storage_path` + des
 * métadonnées (nom original, MIME, taille) pour les autres colonnes.
 */

export type ResultatTeleversement =
  | {
      ok: true;
      cheminBucket: string;
      urlSignee: string;
      mimeType: string;
      nomOriginal: string;
      taille: number;
    }
  | { ok: false; message: string };

export async function televerserJustificatifAction(
  formData: FormData,
): Promise<ResultatTeleversement> {
  // Vérification admin national.
  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return { ok: false, message: 'Action réservée aux admins nationaux.' };
  }

  const fichier = formData.get('fichier');
  if (!(fichier instanceof File)) {
    return { ok: false, message: 'Aucun fichier reçu.' };
  }
  const prefixe = formData.get('prefixe');
  const prefixeChemin = typeof prefixe === 'string' && prefixe.length > 0 ? prefixe : undefined;

  const storage = getJustificatifStorageService();
  return storage.televerser(fichier, prefixeChemin);
}

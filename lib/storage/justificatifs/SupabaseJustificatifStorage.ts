import { getSupabaseServer } from '@/lib/supabase';
import {
  type JustificatifStorageService,
  type MimeJustificatif,
  type ResultatTeleversementJustificatif,
  TAILLE_MAX_JUSTIFICATIF_OCTETS,
  estMimeJustificatifAutorise,
  formaterTailleJustificatif,
} from './types';

const NOM_BUCKET = 'justificatifs';

/**
 * Implémentation Supabase du service Justificatif Storage.
 *
 * Bucket `justificatifs` à provisionner MANUELLEMENT côté Supabase
 * Dashboard (Storage → New bucket → privé). Aucune migration SQL ne
 * crée le bucket (la CLI Supabase ne le supporte pas pour Storage).
 *
 * Sécurité :
 * - Bucket PRIVÉ : aucune URL publique. L'accès se fait via URL signée
 *   temporaire (`createSignedUrl`).
 * - RLS Storage à activer côté Dashboard :
 *   - lecture : admin national + trésorier·ière·s + propriétaire de la
 *     transaction (à brancher quand `verifierDroit('gerer_caisse')`
 *     sera là).
 *   - écriture : admin/trésorier·ière uniquement.
 */
export class SupabaseJustificatifStorage implements JustificatifStorageService {
  async televerser(
    fichier: File,
    prefixeChemin?: string,
  ): Promise<ResultatTeleversementJustificatif> {
    if (!estMimeJustificatifAutorise(fichier.type)) {
      return {
        ok: false,
        message: `Format non supporté (${fichier.type || 'inconnu'}). Formats acceptés : PDF, JPEG, PNG, WebP.`,
      };
    }
    if (fichier.size > TAILLE_MAX_JUSTIFICATIF_OCTETS) {
      return {
        ok: false,
        message: `Fichier trop volumineux (${formaterTailleJustificatif(fichier.size)}). Maximum : ${formaterTailleJustificatif(TAILLE_MAX_JUSTIFICATIF_OCTETS)}.`,
      };
    }

    const supabase = await getSupabaseServer();
    const segments = [prefixeChemin ?? 'general', `${Date.now()}-${fichier.name}`].filter(
      (s) => s !== '',
    );
    const chemin = segments.join('/');

    const { error: erreurUpload } = await supabase.storage
      .from(NOM_BUCKET)
      .upload(chemin, fichier, {
        contentType: fichier.type,
        upsert: false,
      });
    if (erreurUpload !== null) {
      return { ok: false, message: `Téléversement impossible : ${erreurUpload.message}` };
    }

    const { data: signed, error: erreurSign } = await supabase.storage
      .from(NOM_BUCKET)
      .createSignedUrl(chemin, 60);
    if (erreurSign !== null || signed === null) {
      return {
        ok: false,
        message: `URL signée impossible : ${erreurSign?.message ?? 'inconnu'}`,
      };
    }

    return {
      ok: true,
      cheminBucket: chemin,
      urlSignee: signed.signedUrl,
      mimeType: fichier.type as MimeJustificatif,
      nomOriginal: fichier.name,
      taille: fichier.size,
    };
  }

  async obtenirUrlSignee(cheminBucket: string, dureeSec = 60): Promise<string | null> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.storage
      .from(NOM_BUCKET)
      .createSignedUrl(cheminBucket, dureeSec);
    if (error !== null || data === null) return null;
    return data.signedUrl;
  }

  async supprimer(cheminBucket: string): Promise<{ ok: boolean }> {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.storage.from(NOM_BUCKET).remove([cheminBucket]);
    return { ok: error === null };
  }
}

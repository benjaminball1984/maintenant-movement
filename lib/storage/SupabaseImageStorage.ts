import { randomUUID } from 'node:crypto';
import { getSupabaseServer } from '@/lib/supabase';
import {
  type ImageStorageService,
  MIME_AUTORISES,
  type MimeAutorise,
  type ResultatTeleversement,
  type RoleImage,
  TAILLE_MAX_OCTETS,
} from './types';

/**
 * Implémentation Supabase Storage du service Image Storage.
 *
 * Pré-requis côté Supabase (provisionné par la migration
 * `supabase/migrations/20260526220000_storage_media_bucket.sql`) :
 *
 * - Bucket public `media` créé.
 * - `allowed_mime_types` = JPEG / PNG / WebP.
 * - `file_size_limit` = 5 Mo.
 * - Policies RLS : tout authentifié peut uploader ; tout le monde peut lire.
 *
 * Tant que la migration n'est pas appliquée au distant
 * (`supabase db push`), cet adapter renvoie une erreur lisible. Le mode
 * par défaut (`IMAGE_STORAGE_PROVIDER=mock`) reste fonctionnel sans cette
 * migration.
 */
const BUCKET = 'media';

export class SupabaseImageStorage implements ImageStorageService {
  async televerser(
    fichier: File,
    role: RoleImage,
    prefixeChemin?: string,
  ): Promise<ResultatTeleversement> {
    if (!estMimeAutorise(fichier.type)) {
      return {
        ok: false,
        message: `Format non supporté (${fichier.type || 'inconnu'}). Formats acceptés : JPEG, PNG, WebP.`,
      };
    }
    if (fichier.size > TAILLE_MAX_OCTETS) {
      return { ok: false, message: 'Fichier trop volumineux (max 5 Mo).' };
    }

    const supabase = await getSupabaseServer();

    // Chemin : <prefixe>/<role>/<uuid>.<ext>. Le rôle dans le chemin facilite
    // l'audit (`storage/objects` listé par préfixe).
    const extension = extensionDepuisMime(fichier.type);
    const cheminBucket = [prefixeChemin, role, `${randomUUID()}.${extension}`]
      .filter((s): s is string => typeof s === 'string' && s !== '')
      .join('/');

    const { error: erreurUpload } = await supabase.storage
      .from(BUCKET)
      .upload(cheminBucket, fichier, {
        contentType: fichier.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (erreurUpload !== null) {
      return { ok: false, message: `Téléversement impossible : ${erreurUpload.message}` };
    }

    const { data: dataUrl } = supabase.storage.from(BUCKET).getPublicUrl(cheminBucket);
    return {
      ok: true,
      url: dataUrl.publicUrl,
      cheminBucket,
    };
  }

  async supprimer(cheminBucket: string): Promise<{ ok: boolean }> {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.storage.from(BUCKET).remove([cheminBucket]);
    return { ok: error === null };
  }
}

function estMimeAutorise(mime: string): mime is MimeAutorise {
  return (MIME_AUTORISES as readonly string[]).includes(mime);
}

function extensionDepuisMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

'use server';

import { getSession } from '@/lib/auth/session';
import {
  MIME_AUTORISES,
  type ResultatTeleversement,
  type RoleImage,
  TAILLE_MAX_OCTETS,
  getImageStorageService,
} from '@/lib/storage';

/**
 * Server Action de téléversement d'image (exigence transversale ET2 du
 * cycle V2, `docs/cdc-v2/01b-EXIGENCES-TRANSVERSALES-UI.md`).
 *
 * Pipeline (en couches, fail-fast) :
 *
 * 1. Authentification : la personne doit être connectée. Pas d'upload
 *    anonyme (anti-spam, anti-malware).
 * 2. Récupération du fichier depuis `FormData`. Validation minimale qu'on
 *    a bien un `File`.
 * 3. Validation MIME et taille côté serveur (même règles que le client,
 *    deuxième ligne de défense).
 * 4. Délégation à l'adapter (`getImageStorageService()`), qui choisit
 *    entre Mock et Supabase selon `IMAGE_STORAGE_PROVIDER`.
 *
 * Retourne `ResultatTeleversement` : `{ ok: true, url, cheminBucket }` ou
 * `{ ok: false, message }`. La signature est compatible avec le contrat
 * de l'adapter (même type).
 */

const ROLES_VALIDES: readonly RoleImage[] = ['couverture', 'vignette', 'icone'];

function estRoleValide(valeur: unknown): valeur is RoleImage {
  return typeof valeur === 'string' && (ROLES_VALIDES as readonly string[]).includes(valeur);
}

export async function televerserImage(formData: FormData): Promise<ResultatTeleversement> {
  // 1. Authentification.
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise pour téléverser une image.' };
  }

  // 2. Lecture du fichier.
  const fichier = formData.get('fichier');
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { ok: false, message: 'Aucun fichier reçu.' };
  }

  // 3. Validation MIME et taille (deuxième ligne, après le client).
  if (!MIME_AUTORISES.includes(fichier.type as (typeof MIME_AUTORISES)[number])) {
    return {
      ok: false,
      message: `Format non supporté (${fichier.type || 'inconnu'}). Formats acceptés : JPEG, PNG, WebP.`,
    };
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    return { ok: false, message: 'Fichier trop volumineux (max 5 Mo).' };
  }

  // 4. Rôle.
  const roleBrut = formData.get('role');
  if (!estRoleValide(roleBrut)) {
    return { ok: false, message: 'Rôle d’image invalide.' };
  }

  // 5. Préfixe optionnel.
  const prefixeBrut = formData.get('prefixeChemin');
  const prefixeChemin =
    typeof prefixeBrut === 'string' && prefixeBrut !== '' ? prefixeBrut : undefined;

  // 6. Délégation à l'adapter.
  return getImageStorageService().televerser(fichier, roleBrut, prefixeChemin);
}

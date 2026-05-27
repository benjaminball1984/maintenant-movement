/**
 * Helpers de validation de fichiers téléversés (V2.4.71).
 *
 * Validation côté serveur uniquement : on ne fait jamais confiance
 * à la validation côté client (qu'on fait aussi en miroir, mais
 * uniquement pour l'UX).
 *
 * Pur, testable, sans dépendance externe.
 */

/** Tailles standards en octets. */
export const TAILLES = {
  Ko: 1024,
  Mo: 1024 * 1024,
  Go: 1024 * 1024 * 1024,
} as const;

/**
 * Valide qu'un MIME type est dans la liste autorisée.
 *
 * @example mimeAutorise('image/jpeg', ['image/jpeg', 'image/png']) → true
 * @example mimeAutorise('application/pdf', ['image/jpeg']) → false
 */
export function mimeAutorise(mime: string, autorises: readonly string[]): boolean {
  return autorises.includes(mime);
}

export interface ResultatValidationFichier {
  ok: boolean;
  /** Code court pour l'i18n / tests. */
  code?: 'mime_non_autorise' | 'trop_volumineux' | 'taille_zero' | 'nom_vide';
  message?: string;
}

export interface OptionsValidationFichier {
  /** Liste de MIME types autorisés. */
  mimesAutorises: readonly string[];
  /** Taille max en octets. */
  tailleMaxOctets: number;
}

/**
 * Valide un fichier (taille, MIME, nom) et retourne {ok, code?, message?}.
 *
 * @example
 *   validerFichier(
 *     { size: 1024, type: 'image/png', name: 'foo.png' },
 *     { mimesAutorises: ['image/png'], tailleMaxOctets: 5 * TAILLES.Mo }
 *   ) → { ok: true }
 */
export function validerFichier(
  fichier: { size: number; type: string; name: string },
  opts: OptionsValidationFichier,
): ResultatValidationFichier {
  if (fichier.name.trim() === '') {
    return { ok: false, code: 'nom_vide', message: 'Nom de fichier vide.' };
  }
  if (fichier.size <= 0) {
    return { ok: false, code: 'taille_zero', message: 'Fichier vide.' };
  }
  if (fichier.size > opts.tailleMaxOctets) {
    const max = (opts.tailleMaxOctets / TAILLES.Mo).toFixed(1);
    return {
      ok: false,
      code: 'trop_volumineux',
      message: `Fichier trop volumineux (max ${max} Mo).`,
    };
  }
  if (!mimeAutorise(fichier.type, opts.mimesAutorises)) {
    return {
      ok: false,
      code: 'mime_non_autorise',
      message: `Format non supporté (${fichier.type}). Acceptés : ${opts.mimesAutorises.join(', ')}.`,
    };
  }
  return { ok: true };
}

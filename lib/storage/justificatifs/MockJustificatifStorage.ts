import {
  type JustificatifStorageService,
  type MimeJustificatif,
  type ResultatTeleversementJustificatif,
  TAILLE_MAX_JUSTIFICATIF_OCTETS,
  estMimeJustificatifAutorise,
  formaterTailleJustificatif,
} from './types';

/**
 * Implémentation Mock du service Justificatif Storage.
 *
 * Stratégie : encode le fichier en data URL base64. Aucune persistance
 * disque. Fonctionne offline / en tests / en dev sans bucket Supabase.
 *
 * En prod, on bascule sur `SupabaseJustificatifStorage`. Le payload
 * data URL en BDD est OK en dev mais à proscrire en prod pour les
 * justificatifs (PDF qui peuvent peser plusieurs Mo).
 */
export class MockJustificatifStorage implements JustificatifStorageService {
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

    const buffer = await fichier.arrayBuffer();
    const base64 = bufferEnBase64(buffer);
    const dataUrl = `data:${fichier.type};base64,${base64}`;
    const segments = [
      'mock:/',
      prefixeChemin ?? 'justificatifs',
      `${Date.now()}-${fichier.name}`,
    ].filter((s) => s !== '');

    return {
      ok: true,
      cheminBucket: segments.join('/'),
      urlSignee: dataUrl,
      mimeType: fichier.type as MimeJustificatif,
      nomOriginal: fichier.name,
      taille: fichier.size,
    };
  }

  async obtenirUrlSignee(cheminBucket: string, _dureeSec?: number): Promise<string | null> {
    // Mock : pas de re-récupération possible (le data URL était la seule
    // référence). On renvoie null pour signaler l'absence en prod-like.
    if (cheminBucket.startsWith('mock://')) {
      return cheminBucket; // best-effort, l'URL est dans le chemin si conservée
    }
    return null;
  }

  async supprimer(_cheminBucket: string): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}

function bufferEnBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binaire = '';
  for (let i = 0; i < bytes.length; i++) {
    binaire += String.fromCharCode(bytes[i] as number);
  }
  // btoa est dispo en Node 18+ et browser.
  return typeof btoa === 'function'
    ? btoa(binaire)
    : Buffer.from(binaire, 'binary').toString('base64');
}

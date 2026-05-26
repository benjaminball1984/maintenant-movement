import {
  type ImageStorageService,
  MIME_AUTORISES,
  type MimeAutorise,
  type ResultatTeleversement,
  type RoleImage,
  TAILLE_MAX_OCTETS,
} from './types';

/**
 * Implémentation Mock du service Image Storage.
 *
 * Stratégie : on convertit le fichier en **data URL base64** et on le renvoie
 * tel quel. Pas de persistance disque (le data URL vit dans l'objet en BDD
 * ou en mémoire côté caller).
 *
 * Avantages : zéro setup, pas besoin de Supabase Storage local, fonctionne
 * pour les tests unitaires et le dev offline. Tests Vitest peuvent l'appeler
 * sans mock supplémentaire.
 *
 * Inconvénients : les payloads de BDD grossissent si on stocke des data URL
 * (ce qui est OK en dev mais à proscrire en prod). En prod, on bascule sur
 * `SupabaseImageStorage` via `IMAGE_STORAGE_PROVIDER=supabase`.
 */
export class MockImageStorage implements ImageStorageService {
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
      return {
        ok: false,
        message: `Fichier trop volumineux (${formaterTaille(fichier.size)}). Maximum : ${formaterTaille(TAILLE_MAX_OCTETS)}.`,
      };
    }

    const buffer = await fichier.arrayBuffer();
    const base64 = bufferEnBase64(buffer);
    const dataUrl = `data:${fichier.type};base64,${base64}`;

    // Chemin fictif lisible : utile dans les logs et pour distinguer les
    // fichiers mockés des vrais (`mock://...`) lors d'un debug.
    const segments = [
      'mock:/',
      prefixeChemin ?? role,
      `${role}-${Date.now()}-${fichier.name}`,
    ].filter((s) => s !== '');
    return {
      ok: true,
      url: dataUrl,
      cheminBucket: segments.join('/'),
    };
  }

  async supprimer(_cheminBucket: string): Promise<{ ok: boolean }> {
    // No-op : rien à supprimer côté mock (la data URL est portée par la
    // ligne BDD qui la référence, donc la supprimer là-bas suffit).
    return { ok: true };
  }
}

function estMimeAutorise(mime: string): mime is MimeAutorise {
  return (MIME_AUTORISES as readonly string[]).includes(mime);
}

function bufferEnBase64(buffer: ArrayBuffer): string {
  // Node 20 : Buffer est disponible côté Server Action. Côté Edge runtime
  // (Cloudflare Pages), on retomberait sur btoa(String.fromCharCode...),
  // moins efficace mais portable. Le service tourne côté serveur Node,
  // donc Buffer suffit.
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  // Fallback navigateur / Edge runtime.
  const bytes = new Uint8Array(buffer);
  let binaire = '';
  for (const octet of bytes) {
    binaire += String.fromCharCode(octet);
  }
  return btoa(binaire);
}

function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

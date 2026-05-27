import { getSupabaseServer } from '@/lib/supabase';

export interface FichierImage {
  nom: string;
  cheminBucket: string;
  url: string;
  tailleOctets: number;
  mimeType: string | null;
  derniereMaj: string | null;
}

const BUCKET = 'media';

/**
 * Liste les fichiers d'un préfixe du bucket Supabase `media` (V2.4.25).
 *
 * Le SDK Supabase Storage liste par dossier non-récursif : on parcourt
 * donc les sous-dossiers de premier niveau (rôles `couverture` /
 * `vignette` / `icone`) si le préfixe est vide.
 *
 * En mode mock (pas de bucket), on retourne une liste vide.
 */
export async function listerFichiersBucketImages(prefixe = ''): Promise<FichierImage[]> {
  const supabase = await getSupabaseServer();
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefixe, { limit: 100, sortBy: { column: 'updated_at', order: 'desc' } });
    if (error !== null) return [];
    if (data === null) return [];

    const fichiers: FichierImage[] = [];
    for (const item of data) {
      // Les sous-dossiers ont metadata=null. On les ignore pour l'instant
      // (drill-down ultérieur si besoin).
      if (item.metadata === null) continue;
      const cheminBucket = prefixe === '' ? item.name : `${prefixe}/${item.name}`;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(cheminBucket);
      fichiers.push({
        nom: item.name,
        cheminBucket,
        url: pub.publicUrl,
        tailleOctets:
          typeof item.metadata?.size === 'number'
            ? item.metadata.size
            : Number(item.metadata?.size ?? 0),
        mimeType: (item.metadata?.mimetype as string | undefined) ?? null,
        derniereMaj: item.updated_at ?? null,
      });
    }
    return fichiers;
  } catch {
    return [];
  }
}

const PREFIXES_CONNUS = [
  '', // racine
  'journal-affiche',
  'petitions',
  'cagnottes',
  'mobilisations',
  'communes',
  'moments-solidaires',
  'groupes-locaux',
  'campagnes',
  'media',
  'reseau',
] as const;

export type PrefixeImage = (typeof PREFIXES_CONNUS)[number];

export const PREFIXES_IMAGES: readonly PrefixeImage[] = PREFIXES_CONNUS;

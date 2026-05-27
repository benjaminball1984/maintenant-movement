/**
 * Helpers du CMS minimal V2.4.1.
 *
 * Stocke des blocs Markdown identifiés par une `cle` unique. Si la clé
 * n'existe pas en base, retourne le fallback (lorem ipsum). L'admin
 * édite via Server Action.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ContenuEditorial {
  cle: string;
  titre: string | null;
  valeurMd: string;
  updatedAt: string;
  updatedBy: string | null;
}

/**
 * Lit le contenu pour une clé donnée. Retourne le fallback si la clé
 * n'existe pas en base (premier rendu d'une nouvelle page).
 */
export async function lireContenuEditorial(
  cle: string,
  fallback: { titre?: string; valeurMd: string },
): Promise<ContenuEditorial> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('contenu_editorial')
    .select('*')
    .eq('cle', cle)
    .maybeSingle();

  if (data === null) {
    return {
      cle,
      titre: fallback.titre ?? null,
      valeurMd: fallback.valeurMd,
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    };
  }

  return {
    cle: data.cle,
    titre: data.titre,
    valeurMd: data.valeur_md,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
}

/**
 * Lit plusieurs clés d'un coup (utile pour les pages multi-sections).
 */
export async function lireContenusEditoriaux(
  cles: string[],
): Promise<Map<string, ContenuEditorial>> {
  const resultat = new Map<string, ContenuEditorial>();
  if (cles.length === 0) return resultat;
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('contenu_editorial').select('*').in('cle', cles);
  for (const c of data ?? []) {
    resultat.set(c.cle, {
      cle: c.cle,
      titre: c.titre,
      valeurMd: c.valeur_md,
      updatedAt: c.updated_at,
      updatedBy: c.updated_by,
    });
  }
  return resultat;
}

/**
 * Lorem ipsum réutilisable pour les fallbacks. Variantes pour ne pas
 * que toutes les pages affichent le même.
 */
export const LOREM_COURT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const LOREM_MOYEN = `${LOREM_COURT}

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

export const LOREM_LONG = `${LOREM_MOYEN}

## Premier titre

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## Deuxième titre

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

- Ut enim ad minima veniam
- Quis nostrum exercitationem ullam corporis suscipit
- Laboriosam, nisi ut aliquid ex ea commodi consequatur

## Troisième titre

Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.`;

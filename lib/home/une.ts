/**
 * Épinglage de la « une » de la home (chantier V2.6.19).
 *
 * Les helpers `xAlaUne()` (pétition, mobilisation, cagnotte, article) consultent
 * cet épinglage : si l'admin a épinglé un contenu pour l'emplacement, il prime ;
 * sinon, on retombe sur l'automatique (le plus récent).
 */

import { getSupabaseServer } from '@/lib/supabase';

export type EmplacementUne = 'petition' | 'article' | 'mobilisation' | 'cagnotte';

/**
 * Retourne l'id du contenu épinglé à la une pour un emplacement, ou null si
 * rien n'est épinglé (mode automatique).
 */
export async function idEpingleUneHome(emplacement: EmplacementUne): Promise<string | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('une_home')
    .select('objet_id')
    .eq('emplacement', emplacement)
    .maybeSingle();
  return data?.objet_id ?? null;
}

/**
 * Choisit l'élément à mettre à la une dans une liste de candidats publiés
 * (du plus récent au plus ancien) : l'épinglé s'il est présent, sinon le
 * premier (le plus récent). Helper pur, réutilisé par chaque `xAlaUne()`.
 */
export function choisirALaUne<T>(
  liste: T[],
  idEpingle: string | null,
  getId: (item: T) => string,
): T | null {
  if (idEpingle !== null) {
    const epingle = liste.find((item) => getId(item) === idEpingle);
    if (epingle !== undefined) return epingle;
  }
  return liste[0] ?? null;
}

/** Édition du journal mise à la une de la home. */
export interface ArticleUne {
  id: string;
  slug: string;
  titre: string;
  sousTitre: string | null;
  numero: number | null;
  imageCouvertureUrl: string | null;
}

/**
 * Article (édition du journal) à la une : l'épinglé admin s'il existe, sinon la
 * dernière édition publiée. Charge les 60 dernières comme bassin de candidates.
 */
export async function articleAlaUne(): Promise<ArticleUne | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('journal_affiche')
    .select('id, slug, titre, sous_titre, numero, image_couverture_url')
    .eq('statut', 'publie')
    .order('numero', { ascending: false })
    .limit(60);
  if (data === null || data.length === 0) return null;
  const idEpingle = await idEpingleUneHome('article');
  const choisi = choisirALaUne(data, idEpingle, (a) => a.id);
  if (choisi === null) return null;
  return {
    id: choisi.id,
    slug: choisi.slug,
    titre: choisi.titre,
    sousTitre: choisi.sous_titre,
    numero: choisi.numero,
    imageCouvertureUrl: choisi.image_couverture_url,
  };
}

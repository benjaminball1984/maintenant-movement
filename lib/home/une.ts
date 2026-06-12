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

/** Article de Maintenant Médias mis à la une de la home. */
export interface ArticleUne {
  id: string;
  slug: string;
  titre: string;
  sousTitre: string | null;
  numero: number | null;
  imageCouvertureUrl: string | null;
}

/**
 * Article à la une : l'épinglé admin s'il existe, sinon le dernier publié.
 * Charge les 60 derniers comme bassin de candidats.
 *
 * Depuis la clarification du 2026-06-11 (Ben), la « une article » de la home
 * pointe sur les articles de Maintenant Médias (table `media`), PAS sur les
 * éditions du Peuple à l'Affiche (journal-affiche, table `journal_affiche`)
 * qui sont un objet distinct (affiches imprimables).
 */
export async function articleAlaUne(): Promise<ArticleUne | null> {
  const supabase = await getSupabaseServer();
  // Les brèves de la revue de presse (contenus externes imposés par le
  // flux RSS) ne peuvent JAMAIS prendre la une automatique : la une
  // appartient à la rédaction de Maintenant! (revue 2026-06-12, Ben).
  const { data } = await supabase
    .from('media')
    .select('id, slug, titre, corps, vignette_url, publie_le')
    .eq('statut', 'publie')
    .neq('type', 'breve')
    .order('publie_le', { ascending: false })
    .limit(60);
  if (data === null || data.length === 0) return null;
  const idEpingle = await idEpingleUneHome('article');
  const choisi = choisirALaUne(data, idEpingle, (a) => a.id);
  if (choisi === null) return null;
  // Aperçu du corps en guise de sous-titre (la table media n'a pas de
  // colonne sous-titre) : première phrase tronquée proprement.
  const apercu = choisi.corps.trim().slice(0, 180);
  return {
    id: choisi.id,
    slug: choisi.slug,
    titre: choisi.titre,
    sousTitre: apercu === '' ? null : `${apercu}${choisi.corps.trim().length > 180 ? '…' : ''}`,
    numero: null,
    imageCouvertureUrl: choisi.vignette_url,
  };
}

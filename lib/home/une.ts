/**
 * Épinglage de la « une » de la home (chantier V2.6.19, resserré le 15/08/2026).
 *
 * Les helpers `xAlaUne()` (pétition, mobilisation, sondage, cagnotte, article)
 * consultent cet épinglage pour savoir quoi montrer.
 *
 * ## La une est une décision éditoriale, jamais un automatisme
 *
 * Décision de Lilou/Ben (15/08/2026) : **rien ne monte à la une tout seul.**
 * Avant, un bloc sans épinglage retombait sur le contenu publié le plus
 * récent. Conséquence : n'importe quelle publication (y compris importée
 * automatiquement chaque heure) pouvait se retrouver en tête de la page
 * d'accueil sans que personne ne l'ait choisie.
 *
 * Désormais, un emplacement non épinglé reste **vide** : la une n'affiche
 * que ce que l'administration a explicitement sélectionné, depuis la
 * console `/admin/national/une` ou le bouton « Mettre à la une » présent
 * sur chaque fiche.
 */

import { getSupabaseServer } from '@/lib/supabase';

export type EmplacementUne = 'petition' | 'article' | 'mobilisation' | 'cagnotte' | 'sondage';

/**
 * Retourne l'id du contenu épinglé à la une pour un emplacement, ou null si
 * rien n'est épinglé (l'emplacement reste alors vide).
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
 * Choisit l'élément à mettre à la une dans une liste de candidats publiés :
 * **uniquement celui que l'administration a épinglé**. Helper pur, réutilisé
 * par chaque `xAlaUne()`.
 *
 * Retourne `null` dans trois cas, tous volontaires :
 *   - aucun épinglage pour cet emplacement (`idEpingle` vaut null) ;
 *   - le contenu épinglé n'est plus dans la liste des candidats (retiré,
 *     dépublié, mobilisation passée) : on préfère un bloc vide à un
 *     remplacement choisi par la machine ;
 *   - la liste est vide.
 *
 * @param liste Contenus publiés candidats.
 * @param idEpingle Identifiant épinglé par l'admin, ou null.
 * @param getId Comment lire l'identifiant d'un candidat.
 */
export function choisirALaUne<T>(
  liste: T[],
  idEpingle: string | null,
  getId: (item: T) => string,
): T | null {
  if (idEpingle === null) return null;
  return liste.find((item) => getId(item) === idEpingle) ?? null;
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
 * Article à la une : celui que l'administration a épinglé, et lui seul.
 * Charge les 60 derniers publiés comme bassin de candidats (l'épinglé doit
 * s'y trouver ; au-delà, on considère qu'il est trop ancien pour la une).
 *
 * Depuis la clarification du 2026-06-11 (Ben), la « une article » de la home
 * pointe sur les articles de Maintenant Médias (table `media`), PAS sur les
 * éditions du Peuple à l'Affiche (journal-affiche, table `journal_affiche`)
 * qui sont un objet distinct (affiches imprimables).
 */
export async function articleAlaUne(): Promise<ArticleUne | null> {
  const supabase = await getSupabaseServer();
  // Les brèves de la revue de presse (contenus externes imposés par le
  // flux RSS) sont écartées du bassin de candidats : la une appartient à
  // la rédaction de Maintenant! (revue 2026-06-12, Ben).
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

import { getSupabaseServer } from '@/lib/supabase';
import type { Database } from '@/types/database';

type NomTable = keyof Database['public']['Tables'];

/**
 * Compteurs de file de modération par module (V2.4.14).
 *
 * Toutes les requêtes en parallèle, count exact head only (pas de
 * lecture de lignes). Pour chaque module, on remonte ce qui est
 * « en attente d'action » côté modération.
 */
export interface CompteursFileModeration {
  petitionsEnModeration: number;
  campagnesEnModeration: number;
  mobilisationsRetirees: number;
  cagnottesSuspendues: number;
  mediasEnAttente: number;
  sondagesEnModeration: number;
  reservationsEnLitige: number;
  reseauPostsSignales: number;
  reseauMessagesSignales: number;
  selPrestationsContestees: number;
  selPrestationsEnModeration: number;
  groupesEntraideEnModeration: number;
  marcheProduitsSignales: number;
  momentsAModerer: number;
  contenusEditoriauxARediger: number;
}

const PAGES_EDITORIALES_CONNUES = 10;

export async function chargerCompteursFileModeration(): Promise<CompteursFileModeration> {
  const supabase = await getSupabaseServer();

  const requete = (table: NomTable, col: string, val: string) =>
    supabase
      .from(table)
      // biome-ignore lint/suspicious/noExplicitAny: helper compteur générique, col dynamique
      .select(col as any, { count: 'exact', head: true })
      // biome-ignore lint/suspicious/noExplicitAny: idem
      .eq(col as any, val);

  const [
    petitionsRes,
    campagnesRes,
    mobilisationsRes,
    cagnottesRes,
    mediasRes,
    sondagesRes,
    reservationsRes,
    selContesteRes,
    selModerRes,
    groupesEntRes,
    momentsRes,
    contenusRes,
  ] = await Promise.all([
    requete('petition', 'statut', 'en_moderation'),
    requete('campagne', 'statut', 'en_moderation'),
    requete('mobilisation', 'statut', 'retiree'),
    requete('cagnotte', 'statut', 'suspendue'),
    supabase.from('media').select('id', { count: 'exact', head: true }).neq('statut', 'publie'),
    requete('sondage', 'statut', 'en_moderation'),
    requete('reservation', 'statut', 'litige'),
    requete('prestation_sel', 'statut', 'contestee'),
    requete('prestation_sel', 'statut', 'en_moderation'),
    requete('groupe_entraide_local', 'statut', 'en_moderation'),
    requete('moment_solidaire', 'statut', 'retire'),
    supabase.from('contenu_editorial').select('cle', { count: 'exact', head: true }),
  ]);

  // Le modèle réseau pratique la modération a posteriori : on compte les posts
  // retirés (cf. champ retire_le). Pas de champ `signale` séparé en V1.
  const [postsRetiresRes, marcheRetiresRes] = await Promise.all([
    supabase
      .from('post_reseau')
      .select('id', { count: 'exact', head: true })
      .not('retire_le', 'is', null),
    supabase
      .from('produit_marche')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'retire'),
  ]);
  const reseauPostsSignales = postsRetiresRes.count ?? 0;
  // Les messages privés réseau ne sont pas modérés (DM) : on garde 0.
  const reseauMessagesSignales = 0;
  const marcheProduitsSignales = marcheRetiresRes.count ?? 0;

  const contenusEnBase = contenusRes.count ?? 0;
  const contenusEditoriauxARediger = Math.max(0, PAGES_EDITORIALES_CONNUES - contenusEnBase);

  return {
    petitionsEnModeration: petitionsRes.count ?? 0,
    campagnesEnModeration: campagnesRes.count ?? 0,
    mobilisationsRetirees: mobilisationsRes.count ?? 0,
    cagnottesSuspendues: cagnottesRes.count ?? 0,
    mediasEnAttente: mediasRes.count ?? 0,
    sondagesEnModeration: sondagesRes.count ?? 0,
    reservationsEnLitige: reservationsRes.count ?? 0,
    reseauPostsSignales,
    reseauMessagesSignales,
    selPrestationsContestees: selContesteRes.count ?? 0,
    selPrestationsEnModeration: selModerRes.count ?? 0,
    groupesEntraideEnModeration: groupesEntRes.count ?? 0,
    marcheProduitsSignales,
    momentsAModerer: momentsRes.count ?? 0,
    contenusEditoriauxARediger,
  };
}

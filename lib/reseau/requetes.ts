import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Couche de requêtes du réseau social (chantier 7.5).
 *
 * Centralise les lectures : profils, flux hiérarchisé transparent, commentaires,
 * conversations. L'identité affichable d'une personne passe TOUJOURS par la
 * fonction `personne_affichage` (SECURITY DEFINER), qui masque les champs selon
 * `preferences_visibilite`. On ne lit jamais `personne` directement ici.
 */

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

/** Identité affichable minimale d'une personne (champs masqués = null). */
export interface IdentiteAffichee {
  personneId: string;
  numero: string | null;
  prenom: string | null;
  nom: string | null;
  photoUrl: string | null;
}

/** Profil réseau complet (page profil). */
export interface ProfilReseau extends IdentiteAffichee {
  pronom: string | null;
  bio: string | null;
  nbAbonnes: number;
  nbSuivis: number;
  estMoi: boolean;
  jeSuis: boolean;
  estAmi: boolean;
}

/** Publication enrichie pour l'affichage. */
export interface PostAffiche {
  id: string;
  auteur: IdentiteAffichee;
  texte: string;
  imageUrl: string | null;
  createdAt: string;
  nbSoutiens: number;
  nbCommentaires: number;
  jaiSoutenu: boolean;
  /** Niveau dans le flux transparent : 0 = moi, 1 = suivi·e, 2 = reste. */
  palier: 0 | 1 | 2;
}

/** Commentaire enrichi. */
export interface CommentaireAffiche {
  id: string;
  auteur: IdentiteAffichee;
  texte: string;
  createdAt: string;
}

/** Aperçu d'une conversation (messagerie). */
export interface Conversation {
  autre: IdentiteAffichee;
  dernierTexte: string;
  dernierLe: string;
  nonLus: number;
}

/** Message d'un fil de conversation. */
export interface MessageAffiche {
  id: string;
  deMoi: boolean;
  texte: string;
  createdAt: string;
  lu: boolean;
}

/**
 * Nom affiché à partir de prénom/nom (chacun pouvant être masqué). On préfère
 * « Prénom Nom », sinon le morceau visible, sinon « Membre » (jamais de blanc).
 */
export function nomAffiche(prenom: string | null, nom: string | null): string {
  const morceaux = [prenom, nom].filter((m): m is string => m !== null && m.trim() !== '');
  return morceaux.length > 0 ? morceaux.join(' ') : 'Membre';
}

/** Hydrate les identités affichables d'un lot de personnes (dédupliqué). */
async function chargerIdentites(
  supabase: ClientSupabase,
  personneIds: string[],
): Promise<Map<string, IdentiteAffichee>> {
  const uniques = [...new Set(personneIds)];
  const entrees = await Promise.all(
    uniques.map(async (pid) => {
      const { data } = await supabase.rpc('personne_affichage', { cible: pid });
      const ligne = Array.isArray(data) ? data[0] : null;
      const identite: IdentiteAffichee = {
        personneId: pid,
        numero: ligne?.numero_unique ?? null,
        prenom: ligne?.prenom ?? null,
        nom: ligne?.nom ?? null,
        photoUrl: ligne?.photo_url ?? null,
      };
      return [pid, identite] as const;
    }),
  );
  return new Map(entrees);
}

/** Récupère le profil réseau d'une personne par son numéro public (M+7). */
export async function getProfilReseauParNumero(numero: string): Promise<ProfilReseau | null> {
  const supabase = await getSupabaseServer();
  const { data: pid } = await supabase.rpc('personne_id_par_numero', { numero_cible: numero });
  if (pid === null || typeof pid !== 'string') {
    return null;
  }
  const personneId = pid;

  const { data: affData } = await supabase.rpc('personne_affichage', { cible: personneId });
  const aff = Array.isArray(affData) ? affData[0] : null;
  if (aff === null || aff === undefined) {
    return null;
  }

  const [abonnes, suivis] = await Promise.all([
    supabase
      .from('relation_reseau')
      .select('suiveur_id', { count: 'exact', head: true })
      .eq('suivi_id', personneId),
    supabase
      .from('relation_reseau')
      .select('suivi_id', { count: 'exact', head: true })
      .eq('suiveur_id', personneId),
  ]);

  const session = await getSession();
  let estMoi = false;
  let jeSuis = false;
  let estAmi = false;
  if (session !== null) {
    estMoi = session.userId === personneId;
    if (!estMoi) {
      const [{ count: dejaSuivi }, { data: ami }] = await Promise.all([
        supabase
          .from('relation_reseau')
          .select('suivi_id', { count: 'exact', head: true })
          .eq('suiveur_id', session.userId)
          .eq('suivi_id', personneId),
        supabase.rpc('est_ami_reseau', { cible: personneId }),
      ]);
      jeSuis = (dejaSuivi ?? 0) > 0;
      estAmi = ami === true;
    }
  }

  return {
    personneId,
    numero: aff.numero_unique ?? numero,
    prenom: aff.prenom,
    nom: aff.nom,
    pronom: aff.pronom,
    photoUrl: aff.photo_url,
    bio: aff.bio,
    nbAbonnes: abonnes.count ?? 0,
    nbSuivis: suivis.count ?? 0,
    estMoi,
    jeSuis,
    estAmi,
  };
}

/**
 * Compteurs de soutiens/commentaires + « j'ai soutenu » pour un lot de posts,
 * en 3 requêtes groupées (et non N par post).
 */
async function hydraterPosts(
  supabase: ClientSupabase,
  posts: Array<{
    id: string;
    auteurice_id: string;
    texte: string;
    image_url: string | null;
    created_at: string;
  }>,
  viewerId: string | null,
  suivis: Set<string>,
): Promise<PostAffiche[]> {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);

  const [identites, soutiensRes, commentairesRes, mesSoutiensRes] = await Promise.all([
    chargerIdentites(
      supabase,
      posts.map((p) => p.auteurice_id),
    ),
    supabase.from('reaction_reseau').select('post_id').in('post_id', ids),
    supabase.from('commentaire_reseau').select('post_id').in('post_id', ids).eq('statut', 'publie'),
    viewerId !== null
      ? supabase
          .from('reaction_reseau')
          .select('post_id')
          .eq('personne_id', viewerId)
          .in('post_id', ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const compter = (rows: { post_id: string }[] | null): Map<string, number> => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.post_id, (m.get(r.post_id) ?? 0) + 1);
    return m;
  };
  const soutiens = compter(soutiensRes.data);
  const commentaires = compter(commentairesRes.data);
  const mesSoutiens = new Set((mesSoutiensRes.data ?? []).map((r) => r.post_id));

  const identiteVide = (pid: string): IdentiteAffichee => ({
    personneId: pid,
    numero: null,
    prenom: null,
    nom: null,
    photoUrl: null,
  });

  return posts.map((p) => {
    const palier: 0 | 1 | 2 = p.auteurice_id === viewerId ? 0 : suivis.has(p.auteurice_id) ? 1 : 2;
    return {
      id: p.id,
      auteur: identites.get(p.auteurice_id) ?? identiteVide(p.auteurice_id),
      texte: p.texte,
      imageUrl: p.image_url,
      createdAt: p.created_at,
      nbSoutiens: soutiens.get(p.id) ?? 0,
      nbCommentaires: commentaires.get(p.id) ?? 0,
      jaiSoutenu: mesSoutiens.has(p.id),
      palier,
    };
  });
}

/** Ensemble des personnes suivies par le lecteur courant. */
async function chargerSuivis(supabase: ClientSupabase, viewerId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('relation_reseau')
    .select('suivi_id')
    .eq('suiveur_id', viewerId);
  return new Set((data ?? []).map((r) => r.suivi_id));
}

/**
 * Flux hiérarchisé TRANSPARENT (spec §4E) :
 *   1. mes publications (palier 0)
 *   2. publications des personnes suivies (palier 1)
 *   3. le reste (palier 2)
 * Tri : palier croissant, puis date décroissante. Aucune pondération cachée.
 */
export async function getFluxReseau(limite = 60): Promise<PostAffiche[]> {
  const supabase = await getSupabaseServer();
  const session = await getSession();

  const { data, error } = await supabase
    .from('post_reseau')
    .select('id, auteurice_id, texte, image_url, created_at')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error !== null || data === null) {
    return [];
  }

  const viewerId = session?.userId ?? null;
  const suivis = viewerId !== null ? await chargerSuivis(supabase, viewerId) : new Set<string>();
  const hydratees = await hydraterPosts(supabase, data, viewerId, suivis);

  return hydratees.sort((a, b) =>
    a.palier !== b.palier ? a.palier - b.palier : b.createdAt.localeCompare(a.createdAt),
  );
}

/** Publications publiées d'une personne (page profil). */
export async function listerPostsDePersonne(
  personneId: string,
  limite = 30,
): Promise<PostAffiche[]> {
  const supabase = await getSupabaseServer();
  const session = await getSession();
  const { data, error } = await supabase
    .from('post_reseau')
    .select('id, auteurice_id, texte, image_url, created_at')
    .eq('auteurice_id', personneId)
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error !== null || data === null) return [];

  const viewerId = session?.userId ?? null;
  const suivis = viewerId !== null ? await chargerSuivis(supabase, viewerId) : new Set<string>();
  return hydraterPosts(supabase, data, viewerId, suivis);
}

/** Un post seul (page détail), hydraté. `null` si introuvable/retiré. */
export async function getPost(postId: string): Promise<PostAffiche | null> {
  const supabase = await getSupabaseServer();
  const session = await getSession();
  const { data, error } = await supabase
    .from('post_reseau')
    .select('id, auteurice_id, texte, image_url, created_at, statut')
    .eq('id', postId)
    .maybeSingle();
  if (error !== null || data === null || data.statut !== 'publie') return null;

  const viewerId = session?.userId ?? null;
  const suivis = viewerId !== null ? await chargerSuivis(supabase, viewerId) : new Set<string>();
  const [post] = await hydraterPosts(supabase, [data], viewerId, suivis);
  return post ?? null;
}

/** Commentaires publiés d'une publication. */
export async function listerCommentaires(postId: string): Promise<CommentaireAffiche[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('commentaire_reseau')
    .select('id, auteurice_id, texte, created_at')
    .eq('post_id', postId)
    .eq('statut', 'publie')
    .order('created_at', { ascending: true });
  if (error !== null || data === null) return [];

  const identites = await chargerIdentites(
    supabase,
    data.map((c) => c.auteurice_id),
  );
  return data.map((c) => ({
    id: c.id,
    auteur: identites.get(c.auteurice_id) ?? {
      personneId: c.auteurice_id,
      numero: null,
      prenom: null,
      nom: null,
      photoUrl: null,
    },
    texte: c.texte,
    createdAt: c.created_at,
  }));
}

/** Liste des conversations du lecteur courant (dernier message + non-lus). */
export async function listerConversations(): Promise<Conversation[]> {
  const supabase = await getSupabaseServer();
  const session = await getSession();
  if (session === null) return [];
  const moi = session.userId;

  const { data, error } = await supabase
    .from('message_reseau')
    .select('expediteur_id, destinataire_id, texte, created_at, lu')
    .order('created_at', { ascending: false });
  if (error !== null || data === null) return [];

  // Regroupement par correspondant·e (l'autre extrémité du message).
  const parAutre = new Map<string, { dernierTexte: string; dernierLe: string; nonLus: number }>();
  for (const m of data) {
    const autre = m.expediteur_id === moi ? m.destinataire_id : m.expediteur_id;
    const courant = parAutre.get(autre);
    const estNonLuPourMoi = m.destinataire_id === moi && !m.lu;
    if (courant === undefined) {
      parAutre.set(autre, {
        dernierTexte: m.texte,
        dernierLe: m.created_at,
        nonLus: estNonLuPourMoi ? 1 : 0,
      });
    } else if (estNonLuPourMoi) {
      courant.nonLus += 1;
    }
  }

  const identites = await chargerIdentites(supabase, [...parAutre.keys()]);
  return [...parAutre.entries()].map(([autreId, info]) => ({
    autre: identites.get(autreId) ?? {
      personneId: autreId,
      numero: null,
      prenom: null,
      nom: null,
      photoUrl: null,
    },
    dernierTexte: info.dernierTexte,
    dernierLe: info.dernierLe,
    nonLus: info.nonLus,
  }));
}

/** Fil de messages entre le lecteur courant et une autre personne. */
export async function listerFilMessages(autreId: string): Promise<MessageAffiche[]> {
  const supabase = await getSupabaseServer();
  const session = await getSession();
  if (session === null) return [];
  const moi = session.userId;

  const { data, error } = await supabase
    .from('message_reseau')
    .select('id, expediteur_id, texte, created_at, lu')
    .or(
      `and(expediteur_id.eq.${moi},destinataire_id.eq.${autreId}),and(expediteur_id.eq.${autreId},destinataire_id.eq.${moi})`,
    )
    .order('created_at', { ascending: true });
  if (error !== null || data === null) return [];

  return data.map((m) => ({
    id: m.id,
    deMoi: m.expediteur_id === moi,
    texte: m.texte,
    createdAt: m.created_at,
    lu: m.lu,
  }));
}

/** Nombre total de messages non lus du lecteur courant (badge). */
export async function compterMessagesNonLus(): Promise<number> {
  const supabase = await getSupabaseServer();
  const session = await getSession();
  if (session === null) return 0;
  const { count } = await supabase
    .from('message_reseau')
    .select('id', { count: 'exact', head: true })
    .eq('destinataire_id', session.userId)
    .eq('lu', false);
  return count ?? 0;
}

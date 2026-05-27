'use server';

import { journaliser } from '@/lib/admin/national/journal';
import { getSession } from '@/lib/auth/session';
import { poserNotificationTemplee } from '@/lib/notification-templates';
import { type CommentaireAffiche, listerCommentaires } from '@/lib/reseau/requetes';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesCreerCommentaire,
  type DonneesCreerPost,
  type DonneesEnvoyerMessage,
  type DonneesRetraitReseau,
  cibleUuidSchema,
  creerCommentaireSchema,
  creerPostSchema,
  envoyerMessageSchema,
  retraitReseauSchema,
} from '@/lib/validations/reseau';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions du réseau social (chantier 7.5).
 *
 * Pattern `ResultatAction` commun. La RLS (migration 039) reste la barrière
 * réelle ; les checks ici servent des messages clairs. Modération a posteriori :
 * publication immédiate, retrait par la modération avec motif et audit.
 */
export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Publications
// ============================================================
export async function creerPost(donneesBrutes: unknown): Promise<ResultatAction<{ id: string }>> {
  const parse = creerPostSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerPost = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour publier.' };
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('post_reseau')
    .insert({
      auteurice_id: session.userId,
      texte: donnees.texte,
      image_url:
        donnees.image_url === '' || donnees.image_url === undefined ? null : donnees.image_url,
    })
    .select('id')
    .single();
  if (error !== null || data === null) {
    return { ok: false, message: `Publication impossible : ${error?.message ?? ''}` };
  }

  revalidatePath('/s-informer/reseau');
  return { ok: true, id: data.id };
}

export async function supprimerPost(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = cibleUuidSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  // La RLS n'autorise la suppression qu'à l'autrice (ou admin).
  const { error } = await supabase.from('post_reseau').delete().eq('id', parse.data.cible_id);
  if (error !== null) {
    return { ok: false, message: `Suppression impossible : ${error.message}` };
  }
  revalidatePath('/s-informer/reseau');
  return { ok: true };
}

// ============================================================
// Commentaires
// ============================================================
export async function commenter(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = creerCommentaireSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerCommentaire = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour commenter.' };
  }
  const supabase = await getSupabaseServer();

  const { error } = await supabase.from('commentaire_reseau').insert({
    post_id: donnees.post_id,
    auteurice_id: session.userId,
    texte: donnees.texte,
  });
  if (error !== null) {
    return { ok: false, message: `Commentaire impossible : ${error.message}` };
  }

  // Notification best-effort à l'autrice de la publication.
  await notifierAuteuricePost(supabase, donnees.post_id, session.userId);

  revalidatePath('/s-informer/reseau');
  return { ok: true };
}

/** Charge les commentaires d'une publication (lecture à la demande côté client). */
export async function chargerCommentaires(postId: string): Promise<CommentaireAffiche[]> {
  return listerCommentaires(postId);
}

// ============================================================
// Soutien (réaction toggle)
// ============================================================
export async function basculerSoutien(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ soutenu: boolean }>> {
  const parse = cibleUuidSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour soutenir.' };
  }
  const supabase = await getSupabaseServer();
  const postId = parse.data.cible_id;

  const { count } = await supabase
    .from('reaction_reseau')
    .select('post_id', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('personne_id', session.userId);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from('reaction_reseau')
      .delete()
      .eq('post_id', postId)
      .eq('personne_id', session.userId);
    if (error !== null) return { ok: false, message: `Action impossible : ${error.message}` };
    revalidatePath('/s-informer/reseau');
    return { ok: true, soutenu: false };
  }

  const { error } = await supabase
    .from('reaction_reseau')
    .insert({ post_id: postId, personne_id: session.userId });
  if (error !== null) return { ok: false, message: `Action impossible : ${error.message}` };

  // V2.3.30 : notification cloche au·à la créateurice du post.
  try {
    const { data: post } = await supabase
      .from('post_reseau')
      .select('auteurice_id')
      .eq('id', postId)
      .maybeSingle();
    if (post !== null) {
      // V2.4.131 : template editable admin via CMS (notification.reseau_post_soutenu.*).
      // L'ancien message « Quelqu’un a soutenu » est repris dans le defaut du template
      // (lib/notification-templates.ts), mais l'admin peut le personnaliser ({auteur}).
      await poserNotificationTemplee(
        'reseau_post_soutenu',
        { auteur: 'Quelqu’un' },
        {
          destinatairePersonneId: post.auteurice_id,
          href: '/s-informer/reseau',
          cibleId: postId,
          cibleTable: 'post_reseau',
        },
        session.userId,
      );
    }
  } catch (erreur) {
    console.warn('[soutenir] notification ignorée :', erreur);
  }

  revalidatePath('/s-informer/reseau');
  return { ok: true, soutenu: true };
}

// ============================================================
// Suivi
// ============================================================
export async function suivre(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = cibleUuidSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour suivre quelqu’un.' };
  }
  if (parse.data.cible_id === session.userId) {
    return { ok: false, message: 'On ne se suit pas soi-même.' };
  }
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('relation_reseau')
    .insert({ suiveur_id: session.userId, suivi_id: parse.data.cible_id });
  if (error !== null && error.code !== '23505') {
    return { ok: false, message: `Action impossible : ${error.message}` };
  }
  revalidatePath('/s-informer/reseau');
  return { ok: true };
}

export async function nePlusSuivre(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = cibleUuidSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('relation_reseau')
    .delete()
    .eq('suiveur_id', session.userId)
    .eq('suivi_id', parse.data.cible_id);
  if (error !== null) {
    return { ok: false, message: `Action impossible : ${error.message}` };
  }
  revalidatePath('/s-informer/reseau');
  return { ok: true };
}

// ============================================================
// Messagerie interne (DM)
// ============================================================
export async function envoyerMessage(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = envoyerMessageSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesEnvoyerMessage = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour envoyer un message.' };
  }
  if (donnees.destinataire_id === session.userId) {
    return { ok: false, message: 'Tu ne peux pas t’envoyer un message à toi-même.' };
  }
  const supabase = await getSupabaseServer();

  const { error } = await supabase.from('message_reseau').insert({
    expediteur_id: session.userId,
    destinataire_id: donnees.destinataire_id,
    texte: donnees.texte,
  });
  if (error !== null) {
    return { ok: false, message: `Envoi impossible : ${error.message}` };
  }

  // V2.3.30 + V2.4.131 : template editable admin (notification.reseau_message_recu.*).
  // L'apercu du texte est passe en parametre {auteur} pour donner un contexte
  // (utilise dans le template par defaut). Admin peut decider de l'inclure ou non.
  await poserNotificationTemplee(
    'reseau_message_recu',
    { auteur: donnees.texte.slice(0, 140) },
    {
      destinatairePersonneId: donnees.destinataire_id,
      href: '/s-informer/reseau/messages',
      cibleTable: 'message_reseau',
    },
    session.userId,
  );

  revalidatePath('/s-informer/reseau/messages');
  return { ok: true };
}

export async function marquerConversationLue(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = cibleUuidSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('message_reseau')
    .update({ lu: true, lu_le: new Date().toISOString() })
    .eq('destinataire_id', session.userId)
    .eq('expediteur_id', parse.data.cible_id)
    .eq('lu', false);
  if (error !== null) {
    return { ok: false, message: `Action impossible : ${error.message}` };
  }
  revalidatePath('/s-informer/reseau/messages');
  return { ok: true };
}

// ============================================================
// Modération a posteriori (retrait)
// ============================================================
export async function retirerPost(donneesBrutes: unknown): Promise<ResultatAction> {
  return retirerContenu('post_reseau', donneesBrutes, '/admin/moderation/reseau');
}

export async function retirerCommentaire(donneesBrutes: unknown): Promise<ResultatAction> {
  return retirerContenu('commentaire_reseau', donneesBrutes, '/admin/moderation/reseau');
}

// ============================================================
// Helpers internes
// ============================================================

/** Retrait générique d'un contenu réseau (post ou commentaire) par la modération. */
async function retirerContenu(
  table: 'post_reseau' | 'commentaire_reseau',
  donneesBrutes: unknown,
  cheminRevalide: string,
): Promise<ResultatAction> {
  const parse = retraitReseauSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRetraitReseau = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  if (!(await aDroitModerationReseau(supabase))) {
    return { ok: false, message: 'Droit de modération requis.' };
  }

  // Charge l'auteurice avant de retirer (pour la notif).
  const { data: contenuAvant } = await supabase
    .from(table)
    .select('auteurice_id')
    .eq('id', donnees.cible_id)
    .maybeSingle();

  const { error } = await supabase
    .from(table)
    .update({
      statut: 'retire',
      retire_par: session.userId,
      retire_le: new Date().toISOString(),
      raison_retrait: donnees.raison,
    })
    .eq('id', donnees.cible_id);
  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  await journaliser({
    action: `retrait_${table}`,
    cibleTable: table,
    cibleId: donnees.cible_id,
    nouvelEtat: { statut: 'retire', raison: donnees.raison },
  });

  // V2.3.37 + V2.4.131 : notifie l'auteurice via template editable admin.
  // Le titre garde sa variante (post vs commentaire) en passant le bon defaut.
  if (contenuAvant !== null && typeof contenuAvant.auteurice_id === 'string') {
    await poserNotificationTemplee(
      'moderation_me_concerne',
      { motif: donnees.raison },
      {
        destinatairePersonneId: contenuAvant.auteurice_id,
        href: '/s-informer/reseau',
        cibleId: donnees.cible_id,
        cibleTable: table,
      },
      session.userId,
    );
  }

  revalidatePath('/s-informer/reseau');
  revalidatePath(cheminRevalide);
  return { ok: true };
}

/** True si la personne connectée peut modérer le réseau (onglet `reseau` ou admin). */
async function aDroitModerationReseau(supabase: ClientSupabase): Promise<boolean> {
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin === true) return true;
  const { data: estMod } = await supabase.rpc('est_moderateurice', { onglet_demande: 'reseau' });
  return estMod === true;
}

/** Notifie l'autrice d'une publication d'un nouveau commentaire (sauf soi-même). */
async function notifierAuteuricePost(
  supabase: ClientSupabase,
  postId: string,
  commentateurId: string,
): Promise<void> {
  try {
    const { data: post } = await supabase
      .from('post_reseau')
      .select('auteurice_id')
      .eq('id', postId)
      .maybeSingle();
    if (post === null) return;
    // V2.3.30 + V2.4.131 : template editable admin via CMS.
    await poserNotificationTemplee(
      'reseau_post_commente',
      { auteur: 'Quelqu’un' },
      {
        destinatairePersonneId: post.auteurice_id,
        href: '/s-informer/reseau',
        cibleId: postId,
        cibleTable: 'post_reseau',
      },
      commentateurId,
    );
  } catch (erreur) {
    console.warn('[commenter] notification ignorée :', erreur);
  }
}

'use server';

/**
 * Server Action : invitation interne en lot via la messagerie réseau
 * (V2.5.20 — Master Plan V2.6 Phase F sous-chantier V2.5.7.a).
 *
 * Permet à une personne connectée d'envoyer un même message à plusieurs
 * destinataires de son réseau d'un coup, pour les inviter à voir/signer
 * une pétition, rejoindre une commune, etc.
 *
 * Sécurité : envoi via `message_reseau` qui est la table standard de
 * messagerie privée. La RLS de cette table garantit que seul l'expéditeur
 * (auth.uid()) peut insérer un message qui le mentionne en `de_personne_id`.
 * Pas d'élévation, pas de spam massif (cap 30 destinataires/appel).
 */

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { z } from 'zod';

const schemaInvitation = z.object({
  destinataires: z
    .array(z.string().uuid())
    .min(1, 'Choisis au moins une personne.')
    .max(30, 'Maximum 30 destinataires par envoi (anti-spam).'),
  message: z
    .string()
    .trim()
    .min(5, 'Le message doit faire au moins 5 caractères.')
    .max(5000, 'Le message est trop long (max 5000 caractères).'),
});

type Resultat = { ok: true; envoyes: number } | { ok: false; message: string };

export async function inviterReseauAction(donneesBrutes: unknown): Promise<Resultat> {
  const parse = schemaInvitation.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour inviter.' };
  }

  const supabase = await getSupabaseServer();

  // Insertion en batch (un INSERT par destinataire pour bénéficier de la
  // RLS individuelle). Tolérant : si un destinataire échoue (blocage RLS,
  // personne supprimée…), on continue avec les autres.
  let envoyes = 0;
  for (const destinataireId of donnees.destinataires) {
    if (destinataireId === session.userId) continue; // pas s'envoyer à soi-même
    const { error } = await supabase.from('message_reseau').insert({
      expediteur_id: session.userId,
      destinataire_id: destinataireId,
      texte: donnees.message,
    });
    if (error === null) envoyes += 1;
  }

  if (envoyes === 0) {
    return {
      ok: false,
      message: "Aucun message n'a pu être envoyé. Vérifie les destinataires.",
    };
  }

  return { ok: true, envoyes };
}

/**
 * Server Action de lecture : retourne la liste des personnes que je suis
 * (mes "suivis"), pour alimenter la liste de cases à cocher de l'UI
 * d'invitation. Filtré par RLS de relation_reseau.
 */
export async function listerMesSuivisAction(): Promise<
  Array<{
    personneId: string;
    nom: string | null;
    prenom: string | null;
    photoUrl: string | null;
    numero: string | null;
  }>
> {
  const session = await getSession();
  if (session === null) return [];

  const supabase = await getSupabaseServer();
  const { data: relations } = await supabase
    .from('relation_reseau')
    .select('suivi_id')
    .eq('suiveur_id', session.userId);

  const suivisIds = (relations ?? []).map((r) => r.suivi_id);
  if (suivisIds.length === 0) return [];

  // Pour chaque suivi, lire l'identité affichable via la RPC qui gère
  // les préférences de visibilité.
  const identites = await Promise.all(
    suivisIds.map(async (pid) => {
      const { data } = await supabase.rpc('personne_affichage', { cible: pid });
      const ligne = Array.isArray(data) ? data[0] : null;
      return {
        personneId: pid,
        nom: ligne?.nom ?? null,
        prenom: ligne?.prenom ?? null,
        photoUrl: ligne?.photo_url ?? null,
        numero: ligne?.numero_unique ?? null,
      };
    }),
  );

  return identites.sort((a, b) => {
    const na = `${a.prenom ?? ''} ${a.nom ?? ''}`.trim().toLowerCase();
    const nb = `${b.prenom ?? ''} ${b.nom ?? ''}`.trim().toLowerCase();
    return na.localeCompare(nb);
  });
}

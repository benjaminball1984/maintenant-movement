'use server';

import { getSession } from '@/lib/auth/session';
import {
  QUESTIONS_PAR_CLE,
  type QuestionQualification,
  tirerProchaineQuestion,
} from '@/lib/sondages/qualification';
import { getSupabaseServer } from '@/lib/supabase';
import { z } from 'zod';

/**
 * Server Actions de la qualification progressive du profil (sondages V2
 * §6-§7, précisée par Ben le 2026-06-12) : après un vote, une question du
 * panel est proposée, puis une autre automatiquement après chaque réponse
 * (zéro friction), jusqu'à « C'est tout pour aujourd'hui ».
 *
 * Les réponses sont NON PUBLIQUES (table `profil_qualification`, RLS
 * stricte personne-par-personne) et ne servent qu'au redressement par
 * quotas des sondages.
 */

export type ResultatProchaineQuestion =
  | { ok: true; question: QuestionQualification | null }
  | { ok: false; message: string };

/** Séparateur de stockage des réponses à choix multiple. */
const SEPARATEUR_MULTIPLE = ' | ';

/**
 * Clés à exclure du tirage au-delà des questions déjà répondues :
 * la tranche d'âge fine est inutile si la date de naissance du profil
 * est renseignée (donnée déjà « gratuite », CDC §6.3).
 */
async function clesExcluesPourPersonne(personneId: string): Promise<Set<string>> {
  const supabase = await getSupabaseServer();
  const [{ data: reponses }, { data: personne }] = await Promise.all([
    supabase.from('profil_qualification').select('question_cle').eq('personne_id', personneId),
    supabase.from('personne').select('date_naissance').eq('id', personneId).maybeSingle(),
  ]);
  const exclues = new Set<string>((reponses ?? []).map((r) => r.question_cle));
  if (personne?.date_naissance !== null && personne?.date_naissance !== undefined) {
    exclues.add('tranche_age_fine');
  }
  return exclues;
}

/**
 * Prochaine question à proposer à la personne connectée (ou null si le
 * panel est épuisé). Tirage aléatoire pondéré, jamais deux fois la même.
 */
export async function prochaineQuestionQualification(): Promise<ResultatProchaineQuestion> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }
  const exclues = await clesExcluesPourPersonne(session.userId);
  return { ok: true, question: tirerProchaineQuestion(exclues) };
}

const repondreSchema = z
  .object({
    question_cle: z.string().min(2).max(60),
    reponse: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
    reponse_secondaire: z.string().min(1).optional(),
  })
  .strict();

export type ResultatReponseQualification =
  | { ok: true; question_suivante: QuestionQualification | null }
  | { ok: false; message: string };

/**
 * Enregistre une réponse du panel puis retourne immédiatement la question
 * suivante (un seul aller-retour : l'enchaînement reste fluide).
 */
export async function repondreQualification(
  donneesBrutes: unknown,
): Promise<ResultatReponseQualification> {
  const parse = repondreSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const question = QUESTIONS_PAR_CLE.get(donnees.question_cle);
  if (question === undefined) {
    return { ok: false, message: 'Question inconnue.' };
  }

  // Validation de la réponse contre les options du panel.
  let reponseStockee: string;
  if (question.type === 'choix_multiple') {
    const choisies = Array.isArray(donnees.reponse) ? donnees.reponse : [donnees.reponse];
    if (choisies.some((c) => !question.options.includes(c))) {
      return { ok: false, message: 'Réponse hors des options proposées.' };
    }
    reponseStockee = choisies.join(SEPARATEUR_MULTIPLE);
  } else {
    if (Array.isArray(donnees.reponse) || !question.options.includes(donnees.reponse)) {
      return { ok: false, message: 'Réponse hors des options proposées.' };
    }
    reponseStockee = donnees.reponse;
  }

  // Second champ du même écran : requis selon la réponse principale (une ou
  // plusieurs valeurs déclencheuses, ex. bénévolat « Oui… », syndicat
  // « actuellement »/« anciennement »).
  let reponseSecondaire: string | null = null;
  if (question.secondaire !== undefined) {
    const declencheurs = Array.isArray(question.secondaire.requisSi)
      ? question.secondaire.requisSi
      : [question.secondaire.requisSi];
    const requise = declencheurs.includes(reponseStockee);
    if (requise) {
      if (
        donnees.reponse_secondaire === undefined ||
        !question.secondaire.options.includes(donnees.reponse_secondaire)
      ) {
        return { ok: false, message: 'Réponds aussi au second champ.' };
      }
      reponseSecondaire = donnees.reponse_secondaire;
    }
  } else if (donnees.reponse_secondaire !== undefined) {
    return { ok: false, message: 'Cette question n’a pas de second champ.' };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('profil_qualification').upsert(
    {
      personne_id: session.userId,
      question_cle: question.cle,
      reponse: reponseStockee,
      reponse_secondaire: reponseSecondaire,
    },
    { onConflict: 'personne_id,question_cle' },
  );
  if (error !== null) {
    return { ok: false, message: `Enregistrement impossible : ${error.message}` };
  }

  const exclues = await clesExcluesPourPersonne(session.userId);
  return { ok: true, question_suivante: tirerProchaineQuestion(exclues) };
}

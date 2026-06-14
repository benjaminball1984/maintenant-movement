import { estAdminCourant } from '@/lib/auth/admin';
import { type Croisement, croiserParVariable } from '@/lib/sondages/croisements';
import { margeErreur95 } from '@/lib/sondages/fiabilite';
import { CLES_REDRESSEMENT } from '@/lib/sondages/marges-reference';
import { QUESTIONS_PAR_CLE } from '@/lib/sondages/qualification';
import {
  type RepondantQuota,
  agregerPondere,
  calculerPoidsRaking,
  margesRedressement,
} from '@/lib/sondages/raking';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Analyse complète d'un sondage pour l'admin (session 2026-06-14, brique 2-3) :
 * résultat brut, résultat redressé par raking multi-variables, indicateurs de
 * fiabilité (n effectif, effet de plan, marge d'erreur) et tris croisés
 * vote × profil (réservés à l'admin, décision Ben).
 *
 * Lit le profil complet des votant·es (`profil_qualification`) via le client
 * service-role : RÉSERVÉ À L'ADMIN (garde `estAdminCourant`). Les sorties ne
 * contiennent que des AGRÉGATS ; les cellules sous le seuil sont marquées non
 * fiables pour l'anonymat.
 */

export interface CroisementAffichable extends Croisement {
  intitule: string;
}

export interface AnalyseSondage {
  titre: string;
  question: string;
  slug: string;
  options: string[];
  /** Votes bruts par option. */
  brut: number[];
  totalBrut: number;
  /** Votes redressés (raking) par option. */
  pondere: number[];
  totalPondere: number;
  nEffectif: number;
  effetDePlan: number;
  iterations: number;
  convergence: boolean;
  /** Marge d'erreur à 95 % au pire cas (p=50 %) sur le n effectif, en points de %. */
  margeGlobalePts: number;
  /** Nombre de variables de profil renseignées par au moins un·e votant·e. */
  variablesRenseignees: number;
  croisements: CroisementAffichable[];
}

const TAILLE_LOT = 200;

export async function analyserSondage(slug: string): Promise<AnalyseSondage | null> {
  if (!(await estAdminCourant())) return null;
  const admin = getSupabaseAdmin();

  const { data: sondage } = await admin
    .from('sondage')
    .select('id, titre, question, options, slug')
    .eq('slug', slug)
    .maybeSingle();
  if (sondage === null) return null;
  const options = (sondage.options as string[] | null) ?? [];
  const nbOptions = options.length;

  const { data: votes } = await admin
    .from('reponse_sondage')
    .select('personne_id, option_index, genre_declare')
    .eq('sondage_id', sondage.id);
  const lignesVote = votes ?? [];

  // Profils des votant·es (par lots pour éviter un IN() géant).
  const personneIds = [...new Set(lignesVote.map((v) => v.personne_id))];
  const parPersonne = new Map<string, Record<string, string>>();
  for (let i = 0; i < personneIds.length; i += TAILLE_LOT) {
    const lot = personneIds.slice(i, i + TAILLE_LOT);
    const { data: profils } = await admin
      .from('profil_qualification')
      .select('personne_id, question_cle, reponse')
      .in('personne_id', lot);
    for (const p of profils ?? []) {
      const m = parPersonne.get(p.personne_id) ?? {};
      m[p.question_cle] = p.reponse;
      parPersonne.set(p.personne_id, m);
    }
  }

  // Assemblage des répondant·es (option votée + réponses de profil de quota).
  const repondants: RepondantQuota[] = lignesVote.map((v) => {
    const prof = parPersonne.get(v.personne_id) ?? {};
    const reponses: Record<string, string> = {};
    for (const cle of CLES_REDRESSEMENT) {
      const r = prof[cle];
      if (r !== undefined) reponses[cle] = r;
    }
    // Le genre déclaré au moment du vote complète le profil s'il manque.
    if (reponses.genre === undefined && v.genre_declare !== null && v.genre_declare !== '') {
      reponses.genre = v.genre_declare;
    }
    return { optionIndex: v.option_index, reponses };
  });

  // Résultat brut.
  const brut = new Array<number>(nbOptions).fill(0);
  for (const r of repondants) {
    if (r.optionIndex >= 0 && r.optionIndex < nbOptions) {
      brut[r.optionIndex] = (brut[r.optionIndex] ?? 0) + 1;
    }
  }

  // Redressement multi-variables (raking) + agrégation pondérée.
  const marges = margesRedressement();
  const { poids, iterations, convergence } = calculerPoidsRaking(repondants, marges, {
    bornes: [0.2, 5],
  });
  const agg = agregerPondere(repondants, poids, nbOptions);

  // Tris croisés (vote × variable) pour chaque variable renseignée.
  const croisements: CroisementAffichable[] = [];
  let variablesRenseignees = 0;
  for (const cle of CLES_REDRESSEMENT) {
    const question = QUESTIONS_PAR_CLE.get(cle);
    if (question === undefined) continue;
    const nRepondu = repondants.filter((r) => r.reponses[cle] !== undefined).length;
    if (nRepondu === 0) continue;
    variablesRenseignees += 1;
    const cr = croiserParVariable(repondants, poids, nbOptions, cle, question.options);
    cr.colonnes = cr.colonnes.filter((c) => c.nBrut > 0);
    if (cr.colonnes.length > 0) croisements.push({ ...cr, intitule: question.intitule });
  }

  return {
    titre: sondage.titre,
    question: sondage.question,
    slug: sondage.slug,
    options,
    brut,
    totalBrut: repondants.length,
    pondere: agg.totaux,
    totalPondere: agg.total,
    nEffectif: agg.nEffectif,
    effetDePlan: agg.effetDePlan,
    iterations,
    convergence,
    margeGlobalePts: margeErreur95(0.5, agg.nEffectif) * 100,
    variablesRenseignees,
    croisements,
  };
}

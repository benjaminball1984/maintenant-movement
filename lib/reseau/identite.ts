/**
 * Helpers d'identité affichable réutilisables au-delà du réseau social
 * (cycle V2 V2.3.19).
 *
 * S'appuie sur la fonction RPC `personne_affichage(cible)` (SECURITY
 * DEFINER, V1 chantier 7.5) qui retourne l'identité d'une personne en
 * masquant les champs selon ses `preferences_visibilite`. La règle :
 *
 * - Si la personne autorise l'observateur à voir son prénom/nom →
 *   retourne ces valeurs.
 * - Sinon → tous les champs sensibles sont à `null`, seul le numéro
 *   M+7 reste lisible (identifiant public).
 *
 * Le helper `nomAffichageRespectantVisibilite` produit une étiquette
 * humaine à partir de ce qui a survécu au filtre :
 * - `Prénom Nom` si les deux sont visibles.
 * - Le morceau présent (prénom seul, ou nom seul) si l'un est masqué.
 * - Le numéro M+7 (`MABCDEFG`) si tout est masqué.
 * - « Membre » en ultime fallback (la fonction RPC est censée
 *   toujours retourner au moins le numéro, mais on est défensif).
 */

import { getSupabaseServer } from '@/lib/supabase';
import { nomAffiche } from './affichage';

/** Identité affichable d'une personne pour l'observateur courant. */
export interface IdentiteAffichee {
  personneId: string;
  numero: string | null;
  prenom: string | null;
  nom: string | null;
  photoUrl: string | null;
}

/**
 * Charge en batch l'identité affichable d'un lot de personnes pour
 * l'observateur connecté. Déduplique les ids. Une RPC par personne
 * (la fonction RPC s'attend à un id à la fois), exécution parallèle.
 *
 * Retourne une Map indexée par `personne_id`. Personnes inconnues
 * absentes du résultat (pas de clé).
 */
export async function chargerIdentitesAffichables(
  personneIds: Array<string | null | undefined>,
): Promise<Map<string, IdentiteAffichee>> {
  const ids = [
    ...new Set(personneIds.filter((id): id is string => typeof id === 'string' && id.length > 0)),
  ];
  if (ids.length === 0) return new Map();

  const supabase = await getSupabaseServer();
  const entrees = await Promise.all(
    ids.map(async (pid) => {
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

/**
 * Retourne une étiquette humaine prête à afficher à partir d'une
 * identité affichable. Stratégie :
 * - `Prénom Nom` si l'un au moins est visible.
 * - Le numéro M+7 si tout est masqué (identifiant public stable).
 * - « Membre » en fallback ultime.
 */
export function nomAffichageRespectantVisibilite(
  identite: IdentiteAffichee | undefined | null,
): string {
  if (identite === undefined || identite === null) return 'Membre';
  const nomComplet = nomAffiche(identite.prenom, identite.nom);
  if (nomComplet !== 'Membre') return nomComplet;
  if (identite.numero !== null) return identite.numero;
  return 'Membre';
}

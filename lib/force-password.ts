/**
 * Évaluation de la force d'un mot de passe (V2.4.84).
 *
 * Heuristique simple (pas zxcvbn pour éviter la dépendance lourde),
 * suffisante pour donner un feedback UX. La sécurité réelle vient
 * du double opt-in email + magic link (CLAUDE.md §6 stack auth).
 *
 * Critères (chaque critère vaut +1 point) :
 * - longueur ≥ 8 → +1
 * - longueur ≥ 12 → +1
 * - contient minuscule
 * - contient majuscule
 * - contient chiffre
 * - contient caractère spécial
 *
 * Pur, testable.
 */

export type NiveauForcePassword = 'tres_faible' | 'faible' | 'moyen' | 'fort' | 'tres_fort';

export interface ResultatForcePassword {
  score: number; // 0 à 6
  niveau: NiveauForcePassword;
  /** Liste des suggestions pour améliorer le mot de passe. */
  suggestions: string[];
}

const LIBELLE_NIVEAU: Record<NiveauForcePassword, string> = {
  tres_faible: 'très faible',
  faible: 'faible',
  moyen: 'moyen',
  fort: 'fort',
  tres_fort: 'très fort',
};

export function libelleForcePassword(n: NiveauForcePassword): string {
  return LIBELLE_NIVEAU[n];
}

/**
 * Évalue la force d'un mot de passe et retourne score + niveau +
 * suggestions d'amélioration.
 */
export function evaluerForcePassword(password: string): ResultatForcePassword {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score += 1;
  else suggestions.push('Utilisez au moins 8 caractères.');

  if (password.length >= 12) score += 1;
  else if (password.length >= 8) suggestions.push('12 caractères ou plus, c’est encore mieux.');

  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('Ajoutez au moins une lettre minuscule.');

  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('Ajoutez au moins une lettre majuscule.');

  if (/\d/.test(password)) score += 1;
  else suggestions.push('Ajoutez au moins un chiffre.');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else suggestions.push('Ajoutez au moins un caractère spécial.');

  const niveau: NiveauForcePassword =
    score <= 1
      ? 'tres_faible'
      : score === 2
        ? 'faible'
        : score === 3
          ? 'moyen'
          : score === 4 || score === 5
            ? 'fort'
            : 'tres_fort';

  return { score, niveau, suggestions };
}

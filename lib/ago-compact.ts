/**
 * Format relatif compact (V2.4.81).
 *
 * Variante courte de `formaterRelativePassee` (lib/mobilisations/dates.ts)
 * pour les zones denses (badges, chips, lignes serrées). Pas de mots
 * complets : « 5min », « 3h », « 2j », « 4mo », « 1a ».
 *
 * Convention : pas d'espace entre le nombre et l'unité (compact).
 * Le tooltip de la date complète reste la responsabilité de l'appelant.
 *
 * Pur, testable.
 */

/**
 * Format compact d'une date passée. Renvoie `'futur'` si la date est
 * dans le futur (sécurité, format ago est censé être pour le passé).
 *
 * @example agoCompact('2026-05-23T13:55:00Z', new Date('2026-05-23T14:00:00Z'))
 *   → '5min'
 */
export function agoCompact(dateIso: string, maintenant: Date = new Date()): string {
  const date = new Date(dateIso);
  const diffMs = maintenant.getTime() - date.getTime();
  if (diffMs < 0) return 'futur';
  if (diffMs < 60 * 1000) return 'maintenant';

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes}min`;

  const heures = Math.floor(diffMs / (1000 * 60 * 60));
  if (heures < 24) return `${heures}h`;

  const jours = Math.floor(heures / 24);
  if (jours < 30) return `${jours}j`;

  const mois = Math.floor(jours / 30);
  if (mois < 12) return `${mois}mo`;

  const ans = Math.floor(mois / 12);
  return `${ans}a`;
}

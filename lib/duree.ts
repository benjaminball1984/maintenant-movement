/**
 * Helpers de durée formatée (V2.4.83).
 *
 * Pour afficher des durées humaines à partir de millisecondes ou
 * secondes : « 3j 2h », « 2h 15min », « 45s », « 5 jours, 12 heures ».
 *
 * Pur, testable, sans dépendance externe.
 */

/**
 * Formate une durée en millisecondes au format compact « 3j 2h » /
 * « 2h 15min » / « 45min » / « 30s ». 2 unités max.
 *
 * @example formaterDureeCompacte(0) → '0s'
 * @example formaterDureeCompacte(45_000) → '45s'
 * @example formaterDureeCompacte(125_000) → '2min 5s'
 * @example formaterDureeCompacte(3_600_000) → '1h'
 * @example formaterDureeCompacte(90_061_000) → '1j 1h'
 */
export function formaterDureeCompacte(ms: number): string {
  if (ms < 0) return '0s';
  const totalS = Math.floor(ms / 1000);
  if (totalS < 60) return `${totalS}s`;

  const totalMin = Math.floor(totalS / 60);
  if (totalMin < 60) {
    const s = totalS % 60;
    return s > 0 ? `${totalMin}min ${s}s` : `${totalMin}min`;
  }

  const totalH = Math.floor(totalMin / 60);
  if (totalH < 24) {
    const min = totalMin % 60;
    return min > 0 ? `${totalH}h ${min}min` : `${totalH}h`;
  }

  const totalJ = Math.floor(totalH / 24);
  const h = totalH % 24;
  return h > 0 ? `${totalJ}j ${h}h` : `${totalJ}j`;
}

/**
 * Format long « 3 jours, 2 heures et 15 minutes » pour les contextes
 * éditoriaux. Maximum 3 unités.
 *
 * @example formaterDureeLongue(125_000) → '2 minutes et 5 secondes'
 * @example formaterDureeLongue(3_600_000) → '1 heure'
 */
export function formaterDureeLongue(ms: number): string {
  if (ms < 1000) return '0 seconde';
  const totalS = Math.floor(ms / 1000);
  const j = Math.floor(totalS / 86400);
  const h = Math.floor((totalS % 86400) / 3600);
  const min = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;

  const parts: string[] = [];
  if (j > 0) parts.push(`${j} jour${j > 1 ? 's' : ''}`);
  if (h > 0) parts.push(`${h} heure${h > 1 ? 's' : ''}`);
  if (min > 0 && j === 0) parts.push(`${min} minute${min > 1 ? 's' : ''}`);
  if (s > 0 && j === 0 && h === 0) parts.push(`${s} seconde${s > 1 ? 's' : ''}`);

  if (parts.length === 0) return '0 seconde';
  if (parts.length === 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} et ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} et ${parts[2]}`;
}

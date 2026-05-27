/**
 * Helpers de formatage de date (V2.4.47).
 *
 * Centralise les formats les plus utilisés à travers l'app. Tous en
 * `fr-FR`, sortie via `Intl.DateTimeFormat` (fuseau de la machine
 * serveur ou navigateur selon l'appelant).
 *
 * Note : Intl.NumberFormat / DateTimeFormat utilisent une espace
 * insécable étroite (U+202F) entre certaines parties (ex. heure : minute).
 * Les tests doivent utiliser `toContain` / regex plutôt que `toBe` strict.
 */

const FMT_DATE_COURTE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const FMT_DATE_LONGUE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const FMT_DATE_HEURE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const FMT_DATE_ISO_JOUR = (iso: string) => iso.slice(0, 10);

/** « 23 mai 2026 ». */
export function formaterDateCourte(iso: string | Date): string {
  return FMT_DATE_COURTE.format(toDate(iso));
}

/** « samedi 23 mai 2026 ». */
export function formaterDateLongue(iso: string | Date): string {
  return FMT_DATE_LONGUE.format(toDate(iso));
}

/** « 23 mai 2026, 14:00 ». */
export function formaterDateHeure(iso: string | Date): string {
  return FMT_DATE_HEURE.format(toDate(iso));
}

/** « 2026-05-23 » (YYYY-MM-DD, utile pour noms de fichiers). */
export function formaterDateIso(iso: string | Date): string {
  if (typeof iso === 'string') return FMT_DATE_ISO_JOUR(iso);
  return iso.toISOString().slice(0, 10);
}

function toDate(v: string | Date): Date {
  return typeof v === 'string' ? new Date(v) : v;
}

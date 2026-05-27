/**
 * Helpers de formatage des dates de mobilisations.
 *
 * Garde ces helpers à part pour qu'ils soient testables seuls et
 * réutilisables par l'agenda agrégé (`/agenda`, chantier 8.2) le jour
 * où celui-ci arrivera.
 *
 * Convention : tout est en `fr-FR`, fuseau de l'utilisateurice (le
 * serveur n'a pas accès à la timezone du client, donc on délègue le
 * rendu au navigateur via Intl quand c'est possible).
 */

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const FORMAT_DATE_COURT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const FORMAT_HEURE = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Formate « samedi 23 mai 2026 ». Pour les en-têtes de fiche détail.
 */
export function formaterDateLongue(iso: string): string {
  return FORMAT_DATE.format(new Date(iso));
}

/**
 * Formate « 23 mai 2026 ». Pour les cartes denses.
 */
export function formaterDateCourte(iso: string): string {
  return FORMAT_DATE_COURT.format(new Date(iso));
}

/**
 * Formate « 18:30 ».
 */
export function formaterHeure(iso: string): string {
  return FORMAT_HEURE.format(new Date(iso));
}

/**
 * Formate une plage de dates pour l'affichage :
 *   - même jour : « samedi 23 mai 2026, 14:00 → 18:00 »
 *   - plusieurs jours : « du 23 au 25 mai 2026 »
 *   - date_fin null : « samedi 23 mai 2026 à 14:00 »
 */
export function formaterPlage(dateDebutIso: string, dateFinIso: string | null): string {
  const debut = new Date(dateDebutIso);

  if (dateFinIso === null) {
    return `${FORMAT_DATE.format(debut)} à ${FORMAT_HEURE.format(debut)}`;
  }

  const fin = new Date(dateFinIso);

  // Même jour calendaire ?
  const memeJour =
    debut.getUTCFullYear() === fin.getUTCFullYear() &&
    debut.getUTCMonth() === fin.getUTCMonth() &&
    debut.getUTCDate() === fin.getUTCDate();

  if (memeJour) {
    return `${FORMAT_DATE.format(debut)}, ${FORMAT_HEURE.format(debut)} → ${FORMAT_HEURE.format(fin)}`;
  }

  return `du ${FORMAT_DATE_COURT.format(debut)} au ${FORMAT_DATE_COURT.format(fin)}`;
}

/**
 * « il y a 3 jours », « il y a 2 heures », « à l'instant ». Dual de
 * `formaterRelativeAVenir`, pour les contenus historiques (V2.4.32).
 *
 * Renvoie « à venir » si la date est dans le futur (sécurité).
 */
export function formaterRelativePassee(dateIso: string, maintenant = new Date()): string {
  const date = new Date(dateIso);
  const diffMs = maintenant.getTime() - date.getTime();

  if (diffMs < 0) return 'à venir';
  if (diffMs < 60 * 1000) return 'à l’instant';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHeures = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHeures < 24) return `il y a ${diffHeures} h`;

  const diffJours = Math.floor(diffHeures / 24);
  if (diffJours === 1) return 'hier';
  if (diffJours < 30) return `il y a ${diffJours} jours`;

  const diffMois = Math.floor(diffJours / 30);
  if (diffMois < 12) return `il y a ${diffMois} mois`;

  const diffAns = Math.floor(diffMois / 12);
  return `il y a ${diffAns} an${diffAns > 1 ? 's' : ''}`;
}

/**
 * « Dans 3 jours », « Dans 2 heures », « Passée ». Utile pour les listes.
 */
export function formaterRelativeAVenir(dateDebutIso: string, maintenant = new Date()): string {
  const debut = new Date(dateDebutIso);
  const diffMs = debut.getTime() - maintenant.getTime();

  if (diffMs < 0) {
    return 'Passée';
  }

  // Floor (et pas round) pour éviter qu'une mobilisation à 30 min affiche
  // « Dans 1 heure » par arrondi : on préfère « Dans moins d'une heure »,
  // qui ne laisse aucune ambiguïté.
  const diffHeures = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHeures < 1) return 'Dans moins d’une heure';
  if (diffHeures < 24) return `Dans ${diffHeures} heure${diffHeures > 1 ? 's' : ''}`;

  const diffJours = Math.floor(diffHeures / 24);
  if (diffJours === 1) return 'Demain';
  if (diffJours < 30) return `Dans ${diffJours} jours`;

  const diffMois = Math.floor(diffJours / 30);
  return `Dans ${diffMois} mois`;
}

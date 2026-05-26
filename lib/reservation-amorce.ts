/**
 * Génération du message d'amorce d'une réservation (cycle V2 §14,
 * chantier V2.2.2).
 *
 * Le §14 V2 demande qu'une demande de réservation soit **amorcée par un
 * message d'amorce pré-rempli** dans la messagerie interne. La personne
 * peut éditer avant d'envoyer, mais on lui donne un point de départ
 * cohérent avec le contexte (type d'offre, créneau, quantité).
 *
 * Helper pur (sans Supabase), testable directement. Les libellés français
 * sont choisis pour rester sobres et respectueux (cohérent avec le ton
 * du mouvement : ce n'est pas du marketing).
 */

export type OffreTypeReservation =
  | 'transport_covoiturage'
  | 'hebergement'
  | 'pret'
  | 'service_sel'
  | 'location_mutualisee'
  | 'autre';

export interface ContexteAmorce {
  offreType: OffreTypeReservation;
  /** Titre lisible de l'offre. */
  titreOffre: string;
  /** Prénom du demandeur, pour signer le message. */
  prenomDemandeur: string;
  /** Date/heure de début du créneau. */
  creneauDebut: Date;
  /** Date/heure de fin (optionnelle pour les événements ponctuels). */
  creneauFin?: Date;
  /** Quantité demandée (nb personnes pour covoit, nb objets pour prêt, etc.). */
  quantite?: number;
  /** Note libre du demandeur (motivation, contexte). */
  noteLibre?: string;
}

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const FORMAT_JOUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formaterCreneau(debut: Date, fin?: Date): string {
  if (fin === undefined) {
    return FORMAT_DATE.format(debut);
  }
  const memeJour =
    debut.getFullYear() === fin.getFullYear() &&
    debut.getMonth() === fin.getMonth() &&
    debut.getDate() === fin.getDate();
  if (memeJour) {
    return `${FORMAT_DATE.format(debut)} jusqu’à ${new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(fin)}`;
  }
  return `du ${FORMAT_JOUR.format(debut)} au ${FORMAT_JOUR.format(fin)}`;
}

/**
 * Génère le message d'amorce. Le résultat fait toujours moins de 2000
 * caractères (contrainte SQL de `reservation.message_amorce`).
 */
export function genererMessageAmorce(contexte: ContexteAmorce): string {
  const creneau = formaterCreneau(contexte.creneauDebut, contexte.creneauFin);
  const quantite = contexte.quantite ?? 1;
  const titre = contexte.titreOffre.trim();
  const prenom = contexte.prenomDemandeur.trim();
  const note = (contexte.noteLibre ?? '').trim();

  const phraseQuantite = formaterPhraseQuantite(contexte.offreType, quantite);
  const phraseContexte = phraseDeContexte(contexte.offreType);

  const parties = [
    'Bonjour,',
    '',
    `${phraseContexte} « ${titre} » pour ${creneau}${phraseQuantite}.`,
  ];
  if (note !== '') {
    parties.push('', note);
  }
  parties.push('', 'Merci d’avance,');
  if (prenom !== '') {
    parties.push(prenom);
  }

  // Borne anti-débordement (2000 chars dans la migration).
  return parties.join('\n').slice(0, 2000);
}

function formaterPhraseQuantite(offreType: OffreTypeReservation, quantite: number): string {
  if (offreType === 'transport_covoiturage') {
    return quantite === 1 ? ', pour 1 personne' : `, pour ${quantite} personnes`;
  }
  if (offreType === 'hebergement') {
    return quantite === 1 ? ', pour 1 personne' : `, pour ${quantite} personnes`;
  }
  if (offreType === 'pret') {
    return quantite === 1 ? '' : `, pour ${quantite} unités`;
  }
  if (offreType === 'location_mutualisee') {
    return quantite === 1 ? '' : `, pour ${quantite} parts`;
  }
  return '';
}

function phraseDeContexte(offreType: OffreTypeReservation): string {
  switch (offreType) {
    case 'transport_covoiturage':
      return 'Je souhaiterais m’inscrire sur ton trajet';
    case 'hebergement':
      return 'Je souhaiterais te demander un hébergement';
    case 'pret':
      return 'Je souhaiterais te demander à emprunter';
    case 'service_sel':
      return 'Je souhaiterais te demander le service';
    case 'location_mutualisee':
      return 'Je souhaiterais m’inscrire à la location mutualisée';
    default:
      return 'Je souhaiterais te contacter au sujet de l’offre';
  }
}

/**
 * Point d'export unifié des helpers purs de la bibliothèque (V2.4.90).
 *
 * Permet l'import groupé :
 *   import { compter, formaterEuros, slugifier } from '@/lib/helpers-purs';
 *
 * Tous les helpers exportés ici sont :
 * - purs (pas d'effet de bord, pas d'I/O)
 * - testables seuls (sans Supabase / Next / DOM)
 * - sans dépendance externe (sauf Web Crypto API native)
 * - 100 % couverts par tests Vitest
 *
 * 38 modules, ~700 lignes de tests. Cf. les modules individuels pour
 * la documentation détaillée.
 */

// === Identité (validation + normalisation) ===
export { estEmailValide, normaliserEmail } from './email-valide';
export {
  estTelephoneFrValide,
  formaterTelephoneFr,
  normaliserTelephoneFr,
} from './telephone-fr';
export { estCodePostalFrValide, extraireDepartementFr } from './code-postal-fr';
export { estUuidValide, normaliserUuid } from './uuid';
export { estSirenValide, estSiretValide, formaterSiren, formaterSiret } from './siret';
export { estIbanValide, formaterIban, normaliserIban } from './iban';
export { estUrlValide, parserUrl } from './validation-url';
export { estSlugValide, slugifier, slugifierAvecSuffixeTemps } from './slug';
export { validerFichier, mimeAutorise, TAILLES } from './validation-fichier';
export { calculerAge, estMajeur } from './age';

// === Formatage ===
export { formaterEuros, formaterEurosDepuisCentimes } from './format-euros';
export { formaterT99CP } from './format-t99cp';
export { formaterTailleOctets } from './format-taille';
export {
  formaterDateCourte,
  formaterDateHeure,
  formaterDateIso,
  formaterDateLongue,
} from './format-date';
export { formaterDureeCompacte, formaterDureeLongue } from './duree';
export {
  formaterPourcentage,
  pourcentage,
  pourcentageArrondi,
  pourcentageClampe,
} from './pourcentage';
export { capitaliser, decapitaliser, titreCase } from './capitalisation';
export { accorder, compter } from './pluriel';

// === Sécurité / hash ===
export { hashFnv1a, hashFnv1aHex } from './hash';
export { sha256Court, sha256Hex } from './sha256';
export { genererCodeNumerique, genererPassword, genererTokenUrlSafe } from './generer-password';
export {
  evaluerForcePassword,
  libelleForcePassword,
  type NiveauForcePassword,
  type ResultatForcePassword,
} from './force-password';

// === Texte ===
export { apercu, tronquerCaracteres, tronquerMots } from './texte-apercu';
export {
  calculerTempsLectureMinutes,
  compterMots,
  formaterTempsLecture,
} from './temps-lecture';
export {
  comparerPermissif,
  contientTexte,
  normaliserRecherche,
} from './normaliser-recherche';

// === Traitement / collections ===
export { chunk, nbChunks } from './chunk';
export { countBy, groupBy, groupByObjet } from './group-by';
export { lirePageDepuisParams, paginer, type ResultatPagination } from './pagination';

// === Géo ===
export {
  distanceKmArrondie,
  distanceMetres,
  formaterDistance,
  type PointGps,
} from './distance-gps';

// === Couleur / Avatar ===
export {
  avatarHsl,
  initialesPourAvatar,
} from './avatar-couleur';
export {
  contrastTexte,
  estHexValide,
  hexEnRgb,
  luminanceRelative,
  normaliserHex,
} from './couleur-hex';

// === URL ===
export {
  extraireDomaine,
  lienPartageMailto,
  lienPartageMastodon,
  urlAbsolue,
} from './url';

// === Export CSV ===
export {
  composerDocumentCsv,
  composerLigneCsv,
  echapperValeurCsv,
  type ValeurCsv,
} from './export-csv';

// === Conversion / business ===
export {
  centimesEnCoins,
  coinsEnCentimes,
  TAUX_PAR_DEFAUT_CENTIMES,
  totalCentimes,
} from './conversion-99coin';

// === Timestamps ===
export {
  estTimestampValide,
  isoEnSecondes,
  maintenantEnSecondes,
  secondesEnIso,
} from './timestamp';

// === Dates relatives ===
export { agoCompact } from './ago-compact';
// formaterRelativeAVenir, formaterRelativePassee : dans lib/mobilisations/dates.ts
// (pas réexportés ici pour éviter la double-source)

// === Logging ===
export {
  extraireMessage,
  extraireStack,
  logErreur,
  type ContexteErreur,
} from './log-erreur';

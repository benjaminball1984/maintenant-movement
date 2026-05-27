/**
 * Messages de validation editables admin via CMS (V2.4.139).
 *
 * Centralisation des messages d'erreur Zod pour qu'ils puissent etre
 * surcharges depuis le CMS. Chaque schema en `lib/validations/*.ts`
 * exporte une factory `creerXxxSchema(messages?)` qui accepte un
 * dictionnaire de messages partiel. Si non fourni, le schema utilise
 * les valeurs par defaut definies ici.
 *
 * Cote serveur : `lireMessagesValidation(prefixe)` charge les messages
 * CMS et fusionne avec les defauts. La page passe le dictionnaire
 * resolu en prop au Client Component, qui appelle la factory locale.
 *
 * Greffe additive : les exports historiques (`inscriptionSchema`, etc.)
 * restent disponibles tels quels et utilisent les defauts.
 */

import { lireContenuEditorial } from '@/lib/contenu-editorial';

// ============================================================
// Dictionnaires de messages par defaut (groupes par schema)
// ============================================================

export interface MessagesValidationAuth {
  codePostalFormat: string;
  motDePasseLongueur: string;
  motDePasseMinuscule: string;
  motDePasseMajuscule: string;
  motDePasseChiffre: string;
  dateFormat: string;
  ageMin: string;
  turnstileRequis: string;
  nomRequis: string;
  prenomRequis: string;
  pronomRequis: string;
  emailFormat: string;
  telephoneFormat: string;
  cguAcceptees: string;
  motDePasseRequis: string;
}

export const MESSAGES_VALIDATION_AUTH_DEFAUT: MessagesValidationAuth = {
  codePostalFormat: 'Le code postal doit comporter 5 chiffres.',
  motDePasseLongueur: 'Le mot de passe doit comporter au moins 12 caractères.',
  motDePasseMinuscule: 'Le mot de passe doit contenir une minuscule.',
  motDePasseMajuscule: 'Le mot de passe doit contenir une majuscule.',
  motDePasseChiffre: 'Le mot de passe doit contenir un chiffre.',
  dateFormat: 'Format de date invalide.',
  ageMin: 'Tu dois avoir 15 ans révolus pour créer un compte.',
  turnstileRequis: 'Vérification anti-bot requise.',
  nomRequis: 'Le nom est requis.',
  prenomRequis: 'Le prénom est requis.',
  pronomRequis: 'Le pronom est requis (signal politique).',
  emailFormat: "Le format de l'email semble incorrect.",
  telephoneFormat: 'Format de téléphone français invalide.',
  cguAcceptees: "Tu dois accepter la politique de confidentialité pour t'inscrire.",
  motDePasseRequis: 'Le mot de passe est requis.',
};

// ============================================================
// Profil (mise a jour des informations)
// ============================================================

export interface MessagesValidationProfil {
  nomRequis: string;
  prenomRequis: string;
  pronomRequis: string;
  codePostalFormat: string;
  telephoneFormat: string;
  photoUrlFormat: string;
  bioLongueur: string;
  emailFormat: string;
  totpFormat: string;
  signatureUuid: string;
}

export const MESSAGES_VALIDATION_PROFIL_DEFAUT: MessagesValidationProfil = {
  nomRequis: 'Le nom est requis.',
  prenomRequis: 'Le prénom est requis.',
  pronomRequis: 'Le pronom est requis.',
  codePostalFormat: 'Le code postal doit comporter 5 chiffres.',
  telephoneFormat: 'Format de téléphone français invalide.',
  photoUrlFormat: "URL d'image invalide.",
  bioLongueur: 'La bio doit faire 500 caractères maximum.',
  emailFormat: "Le format de l'email semble incorrect.",
  totpFormat: 'Le code TOTP doit comporter 6 chiffres.',
  signatureUuid: 'Signature invalide.',
};

// ============================================================
// Petition (signature + creation + edition + moderation)
// ============================================================

export interface MessagesValidationPetition {
  petitionUuidInvalide: string;
  nomRequis: string;
  prenomRequis: string;
  emailFormat: string;
  codePostalFormat: string;
  telephoneFormat: string;
  turnstileRequis: string;
  titreMin: string;
  titreMax: string;
  texteMin: string;
  texteMax: string;
  destinataireMin: string;
  destinataireMax: string;
  imageUrl: string;
  objectifEntier: string;
  objectifMin: string;
  objectifMax: string;
  dateFormat: string;
  dateCoherence: string;
  raisonRejetRequise: string;
}

export const MESSAGES_VALIDATION_PETITION_DEFAUT: MessagesValidationPetition = {
  petitionUuidInvalide: 'Identifiant de pétition invalide.',
  nomRequis: 'Le nom est requis.',
  prenomRequis: 'Le prénom est requis.',
  emailFormat: "Le format de l'email semble incorrect.",
  codePostalFormat: 'Le code postal doit comporter 5 chiffres.',
  telephoneFormat: 'Format de téléphone français invalide.',
  turnstileRequis: 'Vérification anti-bot requise.',
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  texteMin: 'Le texte doit comporter au moins 100 caractères (argumenter clairement).',
  texteMax: 'Le texte doit faire 5000 caractères maximum.',
  destinataireMin: 'Le destinataire est requis (institution, élu·e, entreprise...).',
  destinataireMax: 'Le destinataire doit faire 200 caractères maximum.',
  imageUrl: "URL d'image invalide.",
  objectifEntier: 'L’objectif doit être un nombre entier.',
  objectifMin: 'L’objectif minimum est 100 signataires.',
  objectifMax: 'L’objectif maximum est 1 000 000 signataires.',
  dateFormat: 'Date invalide (format attendu : AAAA-MM-JJ).',
  dateCoherence: "L'échéance ne peut pas précéder la date de lancement.",
  raisonRejetRequise:
    'Une raison de rejet d’au moins 10 caractères est requise pour rejeter une pétition.',
};

// ============================================================
// Adhesion (3 chemins : gratuit, euros, T99CP)
// ============================================================

export interface MessagesValidationAdhesion {
  turnstileRequis: string;
  txHashFormat: string;
}

export const MESSAGES_VALIDATION_ADHESION_DEFAUT: MessagesValidationAdhesion = {
  turnstileRequis: 'Vérification anti-bot requise.',
  txHashFormat: 'tx_hash invalide (format 0x + 64 hex attendus).',
};

// ============================================================
// Cagnotte (creation + dons + moderation)
// ============================================================

export interface MessagesValidationCagnotte {
  titreMin: string;
  titreMax: string;
  texteMin: string;
  texteMax: string;
  imageUrl: string;
  objectifEntier: string;
  objectifMin: string;
  objectifMax: string;
  walletFormat: string;
  turnstileRequis: string;
  cagnotteUuid: string;
  montantEntier: string;
  montantMin: string;
  montantMax: string;
  codePostalFormat: string;
  emailFormat: string;
  t99cpMontantFormat: string;
  t99cpMontantPositif: string;
  t99cpMontantMax: string;
  txHashFormat: string;
  suspensionRaisonMin: string;
}

export const MESSAGES_VALIDATION_CAGNOTTE_DEFAUT: MessagesValidationCagnotte = {
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  texteMin: 'Le texte doit comporter au moins 100 caractères.',
  texteMax: 'Le texte doit faire 5000 caractères maximum.',
  imageUrl: "URL d'image invalide.",
  objectifEntier: 'L’objectif doit être un nombre entier (en euros).',
  objectifMin: 'L’objectif ne peut pas être négatif.',
  objectifMax: 'L’objectif maximum est 1 000 000 €.',
  walletFormat: 'Adresse wallet invalide (format 0x + 40 hex attendus).',
  turnstileRequis: 'Vérification anti-bot requise.',
  cagnotteUuid: 'Identifiant de cagnotte invalide.',
  montantEntier: 'Le montant doit être un nombre entier de centimes.',
  montantMin: 'Le don minimum est 1 € (100 centimes).',
  montantMax: 'Le don maximum est 1 000 000 € en une transaction.',
  codePostalFormat: 'Le code postal doit comporter 5 chiffres.',
  emailFormat: "Le format de l'email semble incorrect.",
  t99cpMontantFormat: 'Montant T99CP invalide.',
  t99cpMontantPositif: 'Le montant doit être strictement positif.',
  t99cpMontantMax: 'Montant T99CP déraisonnable.',
  txHashFormat: 'tx_hash invalide (format 0x + 64 hex attendus).',
  suspensionRaisonMin: 'La raison de suspension doit faire au moins 10 caractères.',
};

// ============================================================
// Campagne (creation + moderation + modules)
// ============================================================

export interface MessagesValidationCampagne {
  titreMin: string;
  titreMax: string;
  texteMin: string;
  texteMax: string;
  imageUrl: string;
  turnstileRequis: string;
  raisonRejetRequise: string;
  modulePayloadIncoherent: string;
}

export const MESSAGES_VALIDATION_CAMPAGNE_DEFAUT: MessagesValidationCampagne = {
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  texteMin: 'Le texte doit comporter au moins 100 caractères.',
  texteMax: 'Le texte doit faire 5000 caractères maximum.',
  imageUrl: "URL d'image invalide.",
  turnstileRequis: 'Vérification anti-bot requise.',
  raisonRejetRequise:
    'Une raison de rejet d’au moins 10 caractères est requise pour rejeter une campagne.',
  modulePayloadIncoherent:
    'Le payload est incohérent : page_editoriale requiert un texte d’au moins 20 caractères, les autres types requièrent un cible_id.',
};

// ============================================================
// Communes (libre + federation + confederation + tirage)
// ============================================================

export interface MessagesValidationCommunes {
  turnstileRequis: string;
  nomMin: string;
  nomMax: string;
  descriptionMax: string;
  codePostalFormat: string;
  latLngEnsemble: string;
}

export const MESSAGES_VALIDATION_COMMUNES_DEFAUT: MessagesValidationCommunes = {
  turnstileRequis: 'Vérification anti-bot requise.',
  nomMin: 'Le nom doit comporter au moins 3 caractères.',
  nomMax: 'Le nom doit faire 200 caractères maximum.',
  descriptionMax: 'La description doit faire 500 caractères maximum.',
  codePostalFormat: 'Code postal invalide.',
  latLngEnsemble: 'Latitude et longitude doivent être fournies ensemble.',
};

// ============================================================
// Entraide (offre + retrait)
// ============================================================

export interface MessagesValidationEntraide {
  titreMin: string;
  titreMax: string;
  descriptionMin: string;
  descriptionMax: string;
  lieuRequis: string;
  lieuMax: string;
  latitudeFormat: string;
  longitudeFormat: string;
  imageUrl: string;
  latLngEnsemble: string;
  turnstileRequis: string;
  retraitRaisonMin: string;
}

export const MESSAGES_VALIDATION_ENTRAIDE_DEFAUT: MessagesValidationEntraide = {
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  descriptionMin: 'La description doit comporter au moins 30 caractères.',
  descriptionMax: 'La description doit faire 3000 caractères maximum.',
  lieuRequis: 'Le lieu est requis.',
  lieuMax: 'Le lieu doit faire 200 caractères maximum.',
  latitudeFormat: 'Latitude invalide.',
  longitudeFormat: 'Longitude invalide.',
  imageUrl: "URL d'image invalide.",
  latLngEnsemble: 'Latitude et longitude doivent être fournies ensemble (ou aucune).',
  turnstileRequis: 'Vérification anti-bot requise.',
  retraitRaisonMin: 'La raison du retrait doit comporter au moins 10 caractères.',
};

// ============================================================
// Mobilisation (creation + participation + retrait)
// ============================================================

export interface MessagesValidationMobilisation {
  titreMin: string;
  titreMax: string;
  descriptionMin: string;
  descriptionMax: string;
  lieuRequis: string;
  lieuMax: string;
  latitudeFormat: string;
  longitudeFormat: string;
  imageUrl: string;
  dateDebutFormat: string;
  dateFinFormat: string;
  dateCoherence: string;
  latLngEnsemble: string;
  mobilisationUuid: string;
  codePostalFormat: string;
  turnstileRequis: string;
  retraitRaisonMin: string;
  retraitRaisonMax: string;
}

export const MESSAGES_VALIDATION_MOBILISATION_DEFAUT: MessagesValidationMobilisation = {
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  descriptionMin: 'La description doit comporter au moins 50 caractères.',
  descriptionMax: 'La description doit faire 3000 caractères maximum.',
  lieuRequis: 'Le lieu est requis.',
  lieuMax: 'Le lieu doit faire 200 caractères maximum.',
  latitudeFormat: 'Latitude invalide.',
  longitudeFormat: 'Longitude invalide.',
  imageUrl: "URL d'image invalide.",
  dateDebutFormat: 'Date de début invalide (format ISO 8601 attendu).',
  dateFinFormat: 'Date de fin invalide (format ISO 8601 attendu).',
  dateCoherence: 'La date de fin doit être postérieure ou égale à la date de début.',
  latLngEnsemble: 'Latitude et longitude doivent être fournies ensemble (ou aucune).',
  mobilisationUuid: 'Identifiant de mobilisation invalide.',
  codePostalFormat: 'Le code postal doit comporter 5 chiffres.',
  turnstileRequis: 'Vérification anti-bot requise.',
  retraitRaisonMin: 'La raison du retrait doit comporter au moins 10 caractères.',
  retraitRaisonMax: 'La raison du retrait doit faire 500 caractères maximum.',
};

// ============================================================
// Moments solidaires
// ============================================================

export interface MessagesValidationMoments {
  titreMin: string;
  titreMax: string;
  descriptionMin: string;
  descriptionMax: string;
  lieuRequis: string;
  commenceLeFormat: string;
  termineLeFormat: string;
  emailFormat: string;
  latLngEnsemble: string;
  dateCoherence: string;
  turnstileRequis: string;
  prenomRequis: string;
}

export const MESSAGES_VALIDATION_MOMENTS_DEFAUT: MessagesValidationMoments = {
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  descriptionMin: 'La description doit comporter au moins 30 caractères.',
  descriptionMax: 'La description doit faire 3000 caractères maximum.',
  lieuRequis: 'Le lieu est requis.',
  commenceLeFormat: 'Date de début invalide (ISO 8601).',
  termineLeFormat: 'Date de fin invalide (ISO 8601).',
  emailFormat: "Le format de l'email semble incorrect.",
  latLngEnsemble: 'Latitude et longitude doivent être fournies ensemble.',
  dateCoherence: 'La date de fin doit suivre la date de début.',
  turnstileRequis: 'Vérification anti-bot requise.',
  prenomRequis: 'Prénom requis.',
};

// ============================================================
// Sondages
// ============================================================

export interface MessagesValidationSondages {
  titreMin: string;
  titreMax: string;
  questionMin: string;
  questionMax: string;
  optionVide: string;
  optionsMin: string;
  optionsMax: string;
  latLngEnsemble: string;
  optionIndexEntier: string;
  optionIndexInvalide: string;
  codePostalFormat: string;
  turnstileRequis: string;
}

export const MESSAGES_VALIDATION_SONDAGES_DEFAUT: MessagesValidationSondages = {
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  questionMin: 'La question doit comporter au moins 10 caractères.',
  questionMax: 'La question doit faire 500 caractères maximum.',
  optionVide: 'Option vide.',
  optionsMin: 'Au moins 2 options.',
  optionsMax: 'Maximum 10 options.',
  latLngEnsemble: 'Latitude et longitude doivent être fournies ensemble.',
  optionIndexEntier: 'L’option doit être un index entier.',
  optionIndexInvalide: 'Option invalide.',
  codePostalFormat: 'Le code postal doit comporter 5 chiffres.',
  turnstileRequis: 'Vérification anti-bot requise.',
};

// ============================================================
// SEL (services entre particuliers + volontariat)
// ============================================================

export interface MessagesValidationSel {
  titreMin: string;
  titreMax: string;
  descriptionMin: string;
  dureeEntier: string;
  dureeMin: string;
  dureeMax: string;
  lieuRequis: string;
  latLngEnsemble: string;
  dureeReelleMin: string;
  dureeReelleMax: string;
  turnstileRequis: string;
}

export const MESSAGES_VALIDATION_SEL_DEFAUT: MessagesValidationSel = {
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  descriptionMin: 'La description doit comporter au moins 30 caractères.',
  dureeEntier: 'La durée doit être un nombre entier de minutes.',
  dureeMin: 'Durée minimum : 15 minutes.',
  dureeMax: 'Durée maximum : 480 minutes (8 heures).',
  lieuRequis: 'Le lieu est requis.',
  latLngEnsemble: 'Latitude et longitude doivent être fournies ensemble.',
  dureeReelleMin: 'Durée minimum : 1 minute.',
  dureeReelleMax: 'Durée maximum : 480 minutes.',
  turnstileRequis: 'Vérification anti-bot requise.',
};

// ============================================================
// Reseau social
// ============================================================

export interface MessagesValidationReseau {
  postTexteMin: string;
  postTexteMax: string;
  postImageUrl: string;
  postTurnstileRequis: string;
  publicationUuid: string;
  commentaireMin: string;
  commentaireMax: string;
  destinataireUuid: string;
  messageMin: string;
  messageMax: string;
  cibleUuid: string;
  retraitRaisonMin: string;
  retraitRaisonMax: string;
}

export const MESSAGES_VALIDATION_RESEAU_DEFAUT: MessagesValidationReseau = {
  postTexteMin: 'Écris quelque chose avant de publier.',
  postTexteMax: 'Une publication fait au maximum 5000 caractères.',
  postImageUrl: 'Le lien de l’image semble incorrect.',
  postTurnstileRequis: 'Vérification anti-bot manquante.',
  publicationUuid: 'Publication invalide.',
  commentaireMin: 'Le commentaire est vide.',
  commentaireMax: 'Un commentaire fait au maximum 2000 caractères.',
  destinataireUuid: 'Destinataire invalide.',
  messageMin: 'Le message est vide.',
  messageMax: 'Un message fait au maximum 5000 caractères.',
  cibleUuid: 'Identifiant invalide.',
  retraitRaisonMin: 'Le motif de retrait doit faire au moins 10 caractères.',
  retraitRaisonMax: 'Le motif est trop long.',
};

// ============================================================
// Media (Maintenant Medias)
// ============================================================

export interface MessagesValidationMedia {
  titreMin: string;
  titreMax: string;
  corpsMin: string;
  corpsMax: string;
  provenanceSourceRequise: string;
  retraitRaisonMin: string;
  turnstileRequis: string;
}

export const MESSAGES_VALIDATION_MEDIA_DEFAUT: MessagesValidationMedia = {
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  corpsMin: 'Le corps doit comporter au moins 30 caractères.',
  corpsMax: 'Corps trop long (50000 caractères max).',
  provenanceSourceRequise:
    'Quand une provenance externe est renseignée, une URL source est obligatoire (transparence).',
  retraitRaisonMin: 'La raison du retrait doit comporter au moins 10 caractères.',
  turnstileRequis: 'Vérification anti-bot requise.',
};

// ============================================================
// Moderation (retraits Moments/Sondages/SEL/Org)
// ============================================================

export interface MessagesValidationModeration {
  raisonMin: string;
  raisonMax: string;
  momentUuid: string;
  sondageUuid: string;
  serviceUuid: string;
  organisationUuid: string;
}

export const MESSAGES_VALIDATION_MODERATION_DEFAUT: MessagesValidationModeration = {
  raisonMin: 'Indique une raison d’au moins 10 caractères.',
  raisonMax: '500 caractères maximum.',
  momentUuid: 'Moment invalide.',
  sondageUuid: 'Sondage invalide.',
  serviceUuid: 'Service invalide.',
  organisationUuid: 'Organisation invalide.',
};

// ============================================================
// Autres moyens d'agir (organisations partenaires)
// ============================================================

export interface MessagesValidationAutresMoyens {
  nomMin: string;
  nomMax: string;
  descriptionMax: string;
  urlInvalide: string;
  categorieSlugInvalide: string;
  retraitRaisonMin: string;
}

export const MESSAGES_VALIDATION_AUTRES_MOYENS_DEFAUT: MessagesValidationAutresMoyens = {
  nomMin: 'Le nom doit comporter au moins 3 caractères.',
  nomMax: 'Le nom doit faire 200 caractères maximum.',
  descriptionMax: 'La description doit faire 500 caractères maximum.',
  urlInvalide: 'URL invalide.',
  categorieSlugInvalide: 'Slug de catégorie invalide.',
  retraitRaisonMin: 'La raison du retrait doit faire au moins 10 caractères.',
};

// ============================================================
// Droit admin (accorder/retirer)
// ============================================================

export interface MessagesValidationDroitAdmin {
  personneUuid: string;
  communeUuid: string;
  droitUuid: string;
  animationCommuneRequise: string;
  scopeCommuneInterdit: string;
  perimetreOngletReserve: string;
}

export const MESSAGES_VALIDATION_DROIT_ADMIN_DEFAUT: MessagesValidationDroitAdmin = {
  personneUuid: 'Personne invalide.',
  communeUuid: 'Commune invalide.',
  droitUuid: 'Droit invalide.',
  animationCommuneRequise: 'Une commune est requise pour un droit d’animation.',
  scopeCommuneInterdit: 'Seul un droit d’animation cible une commune.',
  perimetreOngletReserve: 'Un périmètre d’onglets ne s’applique qu’à la modération.',
};

// ============================================================
// Marche solidaire (produit + boutique + minimarche + notation + achat)
// ============================================================

export interface MessagesValidationMarche {
  t99cpMontantFormat: string;
  t99cpMontantMax: string;
  titreMin: string;
  titreMax: string;
  descriptionMin: string;
  descriptionMax: string;
  prixEurosEntier: string;
  prixEurosMin: string;
  prixEurosMax: string;
  categorieSlugInvalide: string;
  imageUrl: string;
  lieuRequis: string;
  lieuMax: string;
  retraitChoix: string;
  modeCoherent: string;
  retraitRaisonMin: string;
  retraitRaisonMax: string;
  acheteureuseUuid: string;
  etoilesEntier: string;
  etoilesMin: string;
  etoilesMax: string;
  commentaireMax: string;
  nomMin: string;
  nomMax: string;
  ouverteDuFormat: string;
  ouverteAuFormat: string;
  ouvertureCoherente: string;
  monnaieMin: string;
  monnaieMax: string;
  commenceLeFormat: string;
  termineLeFormat: string;
  dateCoherence: string;
  latLngEnsemble: string;
  txHashFormat: string;
  txHashRequisT99CP: string;
  turnstileRequis: string;
}

export const MESSAGES_VALIDATION_MARCHE_DEFAUT: MessagesValidationMarche = {
  t99cpMontantFormat: 'Montant T99CP invalide.',
  t99cpMontantMax: 'Montant T99CP déraisonnable.',
  titreMin: 'Le titre doit comporter au moins 5 caractères.',
  titreMax: 'Le titre doit faire 200 caractères maximum.',
  descriptionMin: 'La description doit comporter au moins 30 caractères.',
  descriptionMax: 'La description doit faire 3000 caractères maximum.',
  prixEurosEntier: 'Le prix doit être un nombre entier de centimes.',
  prixEurosMin: 'Le prix ne peut pas être négatif.',
  prixEurosMax: 'Prix maximum : 1 000 000 € en une transaction.',
  categorieSlugInvalide: 'Slug de catégorie invalide.',
  imageUrl: "URL d'image invalide.",
  lieuRequis: 'Le lieu de retrait est requis.',
  lieuMax: 'Le lieu doit faire 200 caractères maximum.',
  retraitChoix: 'Au moins un mode de retrait doit être sélectionné.',
  modeCoherent:
    'En mode vente, indique un prix en euros et/ou en T99CP. En mode don, laisse les prix à 0.',
  retraitRaisonMin: 'Indique brièvement la raison.',
  retraitRaisonMax: '500 caractères maximum.',
  acheteureuseUuid: 'Identifiant d’acheteureuse invalide.',
  etoilesEntier: 'Le nombre d’étoiles doit être un entier.',
  etoilesMin: 'Minimum 1 étoile.',
  etoilesMax: 'Maximum 5 étoiles.',
  commentaireMax: '1000 caractères maximum.',
  nomMin: 'Le nom doit comporter au moins 3 caractères.',
  nomMax: '200 caractères maximum.',
  ouverteDuFormat: 'Date de début invalide (ISO 8601).',
  ouverteAuFormat: 'Date de fin invalide (ISO 8601).',
  ouvertureCoherente:
    'Les dates d’ouverture doivent aller ensemble et la date de début doit précéder la fin.',
  monnaieMin: 'Au moins une monnaie doit être acceptée.',
  monnaieMax: 'Catalogue limité à 4 monnaies (T99CP, EUR, Ğ1, MNLC).',
  commenceLeFormat: 'Date de début invalide (ISO 8601).',
  termineLeFormat: 'Date de fin invalide (ISO 8601).',
  dateCoherence: 'La date de fin doit suivre la date de début.',
  latLngEnsemble: 'Latitude et longitude doivent être fournies ensemble.',
  txHashFormat: 'tx_hash invalide (format 0x + 64 hex attendus).',
  txHashRequisT99CP: 'tx_hash requis pour un achat en T99CP.',
  turnstileRequis: 'Vérification anti-bot requise.',
};

// ============================================================
// Lecture des messages depuis le CMS
// ============================================================

/**
 * Lit les messages de validation auth depuis le CMS et fusionne avec
 * les defauts. A appeler depuis un Server Component avant de passer
 * le dictionnaire en prop au formulaire client.
 *
 * Cles CMS : `validation.auth.<nomDuMessage>`.
 */
export async function lireMessagesValidationAuth(): Promise<MessagesValidationAuth> {
  const cles = Object.keys(MESSAGES_VALIDATION_AUTH_DEFAUT) as Array<keyof MessagesValidationAuth>;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.auth.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_AUTH_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_AUTH_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationAuth;
}

/**
 * Lit les messages de validation marche solidaire depuis le CMS et fusionne
 * avec les defauts. Cles CMS : `validation.marche.<nomDuMessage>`.
 */
export async function lireMessagesValidationMarche(): Promise<MessagesValidationMarche> {
  const cles = Object.keys(MESSAGES_VALIDATION_MARCHE_DEFAUT) as Array<
    keyof MessagesValidationMarche
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.marche.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_MARCHE_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_MARCHE_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationMarche;
}

/**
 * Lit les messages de validation reseau social depuis le CMS et fusionne
 * avec les defauts. Cles CMS : `validation.reseau.<nomDuMessage>`.
 */
export async function lireMessagesValidationReseau(): Promise<MessagesValidationReseau> {
  const cles = Object.keys(MESSAGES_VALIDATION_RESEAU_DEFAUT) as Array<
    keyof MessagesValidationReseau
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.reseau.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_RESEAU_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_RESEAU_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationReseau;
}

/**
 * Lit les messages de validation media depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.media.<nomDuMessage>`.
 */
export async function lireMessagesValidationMedia(): Promise<MessagesValidationMedia> {
  const cles = Object.keys(MESSAGES_VALIDATION_MEDIA_DEFAUT) as Array<
    keyof MessagesValidationMedia
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.media.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_MEDIA_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_MEDIA_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationMedia;
}

/**
 * Lit les messages de validation moderation depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.moderation.<nomDuMessage>`.
 */
export async function lireMessagesValidationModeration(): Promise<MessagesValidationModeration> {
  const cles = Object.keys(MESSAGES_VALIDATION_MODERATION_DEFAUT) as Array<
    keyof MessagesValidationModeration
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.moderation.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_MODERATION_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_MODERATION_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationModeration;
}

/**
 * Lit les messages de validation autres moyens d'agir depuis le CMS et fusionne
 * avec les defauts. Cles CMS : `validation.autresMoyens.<nomDuMessage>`.
 */
export async function lireMessagesValidationAutresMoyens(): Promise<MessagesValidationAutresMoyens> {
  const cles = Object.keys(MESSAGES_VALIDATION_AUTRES_MOYENS_DEFAUT) as Array<
    keyof MessagesValidationAutresMoyens
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.autresMoyens.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_AUTRES_MOYENS_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_AUTRES_MOYENS_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationAutresMoyens;
}

/**
 * Lit les messages de validation droit admin depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.droitAdmin.<nomDuMessage>`.
 */
export async function lireMessagesValidationDroitAdmin(): Promise<MessagesValidationDroitAdmin> {
  const cles = Object.keys(MESSAGES_VALIDATION_DROIT_ADMIN_DEFAUT) as Array<
    keyof MessagesValidationDroitAdmin
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.droitAdmin.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_DROIT_ADMIN_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_DROIT_ADMIN_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationDroitAdmin;
}

/**
 * Lit les messages de validation SEL depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.sel.<nomDuMessage>`.
 */
export async function lireMessagesValidationSel(): Promise<MessagesValidationSel> {
  const cles = Object.keys(MESSAGES_VALIDATION_SEL_DEFAUT) as Array<keyof MessagesValidationSel>;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.sel.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_SEL_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_SEL_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationSel;
}

/**
 * Lit les messages de validation sondages depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.sondages.<nomDuMessage>`.
 */
export async function lireMessagesValidationSondages(): Promise<MessagesValidationSondages> {
  const cles = Object.keys(MESSAGES_VALIDATION_SONDAGES_DEFAUT) as Array<
    keyof MessagesValidationSondages
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.sondages.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_SONDAGES_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_SONDAGES_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationSondages;
}

/**
 * Lit les messages de validation moments solidaires depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.moments.<nomDuMessage>`.
 */
export async function lireMessagesValidationMoments(): Promise<MessagesValidationMoments> {
  const cles = Object.keys(MESSAGES_VALIDATION_MOMENTS_DEFAUT) as Array<
    keyof MessagesValidationMoments
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.moments.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_MOMENTS_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_MOMENTS_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationMoments;
}

/**
 * Lit les messages de validation mobilisation depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.mobilisation.<nomDuMessage>`.
 */
export async function lireMessagesValidationMobilisation(): Promise<MessagesValidationMobilisation> {
  const cles = Object.keys(MESSAGES_VALIDATION_MOBILISATION_DEFAUT) as Array<
    keyof MessagesValidationMobilisation
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.mobilisation.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_MOBILISATION_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_MOBILISATION_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationMobilisation;
}

/**
 * Lit les messages de validation entraide depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.entraide.<nomDuMessage>`.
 */
export async function lireMessagesValidationEntraide(): Promise<MessagesValidationEntraide> {
  const cles = Object.keys(MESSAGES_VALIDATION_ENTRAIDE_DEFAUT) as Array<
    keyof MessagesValidationEntraide
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.entraide.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_ENTRAIDE_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_ENTRAIDE_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationEntraide;
}

/**
 * Lit les messages de validation communes depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.communes.<nomDuMessage>`.
 */
export async function lireMessagesValidationCommunes(): Promise<MessagesValidationCommunes> {
  const cles = Object.keys(MESSAGES_VALIDATION_COMMUNES_DEFAUT) as Array<
    keyof MessagesValidationCommunes
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.communes.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_COMMUNES_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_COMMUNES_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationCommunes;
}

/**
 * Lit les messages de validation campagne depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.campagne.<nomDuMessage>`.
 */
export async function lireMessagesValidationCampagne(): Promise<MessagesValidationCampagne> {
  const cles = Object.keys(MESSAGES_VALIDATION_CAMPAGNE_DEFAUT) as Array<
    keyof MessagesValidationCampagne
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.campagne.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_CAMPAGNE_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_CAMPAGNE_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationCampagne;
}

/**
 * Lit les messages de validation cagnotte depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.cagnotte.<nomDuMessage>`.
 */
export async function lireMessagesValidationCagnotte(): Promise<MessagesValidationCagnotte> {
  const cles = Object.keys(MESSAGES_VALIDATION_CAGNOTTE_DEFAUT) as Array<
    keyof MessagesValidationCagnotte
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.cagnotte.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_CAGNOTTE_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_CAGNOTTE_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationCagnotte;
}

/**
 * Lit les messages de validation adhesion depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.adhesion.<nomDuMessage>`.
 */
export async function lireMessagesValidationAdhesion(): Promise<MessagesValidationAdhesion> {
  const cles = Object.keys(MESSAGES_VALIDATION_ADHESION_DEFAUT) as Array<
    keyof MessagesValidationAdhesion
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.adhesion.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_ADHESION_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_ADHESION_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationAdhesion;
}

/**
 * Lit les messages de validation petition depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.petition.<nomDuMessage>`.
 */
export async function lireMessagesValidationPetition(): Promise<MessagesValidationPetition> {
  const cles = Object.keys(MESSAGES_VALIDATION_PETITION_DEFAUT) as Array<
    keyof MessagesValidationPetition
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.petition.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_PETITION_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_PETITION_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationPetition;
}

/**
 * Lit les messages de validation profil depuis le CMS et fusionne avec
 * les defauts. Cles CMS : `validation.profil.<nomDuMessage>`.
 */
export async function lireMessagesValidationProfil(): Promise<MessagesValidationProfil> {
  const cles = Object.keys(MESSAGES_VALIDATION_PROFIL_DEFAUT) as Array<
    keyof MessagesValidationProfil
  >;
  const lectures = await Promise.all(
    cles.map((cle) =>
      lireContenuEditorial(`validation.profil.${cle}`, {
        valeurMd: MESSAGES_VALIDATION_PROFIL_DEFAUT[cle],
      }),
    ),
  );
  const resultat: Record<string, string> = {};
  cles.forEach((cle, i) => {
    resultat[cle] = lectures[i]?.valeurMd ?? MESSAGES_VALIDATION_PROFIL_DEFAUT[cle];
  });
  return resultat as unknown as MessagesValidationProfil;
}

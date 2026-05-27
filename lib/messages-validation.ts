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

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

/**
 * Lecteurs CMS des messages de validation (V2.5.22 — extrait de
 * `lib/messages-validation.ts`).
 *
 * Server-only : importe `lireContenuEditorial` qui dépend de `cookies()`
 * via `getSupabaseServer`. Importer depuis un composant client ferait
 * remonter `next/headers` dans le bundle client.
 *
 * Les types et constantes `MESSAGES_VALIDATION_*_DEFAUT` restent dans
 * `lib/messages-validation.ts` qui est, lui, client-safe.
 */

import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  MESSAGES_VALIDATION_ADHESION_DEFAUT,
  MESSAGES_VALIDATION_AUTH_DEFAUT,
  MESSAGES_VALIDATION_AUTRES_MOYENS_DEFAUT,
  MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
  MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
  MESSAGES_VALIDATION_COMMUNES_DEFAUT,
  MESSAGES_VALIDATION_DROIT_ADMIN_DEFAUT,
  MESSAGES_VALIDATION_ENTRAIDE_DEFAUT,
  MESSAGES_VALIDATION_MARCHE_DEFAUT,
  MESSAGES_VALIDATION_MEDIA_DEFAUT,
  MESSAGES_VALIDATION_MOBILISATION_DEFAUT,
  MESSAGES_VALIDATION_MODERATION_DEFAUT,
  MESSAGES_VALIDATION_MOMENTS_DEFAUT,
  MESSAGES_VALIDATION_PETITION_DEFAUT,
  MESSAGES_VALIDATION_PROFIL_DEFAUT,
  MESSAGES_VALIDATION_RESEAU_DEFAUT,
  MESSAGES_VALIDATION_SEL_DEFAUT,
  MESSAGES_VALIDATION_SONDAGES_DEFAUT,
  type MessagesValidationAdhesion,
  type MessagesValidationAuth,
  type MessagesValidationAutresMoyens,
  type MessagesValidationCagnotte,
  type MessagesValidationCampagne,
  type MessagesValidationCommunes,
  type MessagesValidationDroitAdmin,
  type MessagesValidationEntraide,
  type MessagesValidationMarche,
  type MessagesValidationMedia,
  type MessagesValidationMobilisation,
  type MessagesValidationModeration,
  type MessagesValidationMoments,
  type MessagesValidationPetition,
  type MessagesValidationProfil,
  type MessagesValidationReseau,
  type MessagesValidationSel,
  type MessagesValidationSondages,
} from '@/lib/messages-validation';

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

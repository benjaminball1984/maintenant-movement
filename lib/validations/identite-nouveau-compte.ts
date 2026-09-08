import { z } from 'zod';

/**
 * Identité demandée quand un geste crée un compte au passage (V2.6.141).
 *
 * Décisions Lilou/Ben du 08/09/2026 : on adhère sans compte, on vote sans
 * compte, et le compte naît du geste. Les deux parcours demandent alors la
 * même chose, et doivent la valider de la même façon : ce module est la
 * seule définition de ces champs, réutilisée des deux côtés
 * (`lib/validations/adhesion.ts`, `lib/validations/sondages.ts`).
 *
 * Aucun mot de passe : cf. `lib/auth/creer-compte-sans-mot-de-passe`.
 */

/**
 * Messages attendus. Toute interface de messages qui porte ces clés
 * convient (typage structurel) : c'est le cas de
 * `MessagesValidationAdhesion` et `MessagesValidationSondages`.
 */
export interface MessagesIdentiteNouveauCompte {
  prenomRequis: string;
  nomRequis: string;
  emailFormat: string;
  codePostalFormat: string;
  telephoneFormat: string;
  dateFormat: string;
  ageMin: string;
}

/** Âge minimum pour ouvrir un compte sur le site (RGPD §5G). */
export const AGE_MINIMUM_ANS = 15;

/**
 * Les six champs d'identité, en objet Zod « nu » pour pouvoir être
 * étendu (`.extend({...})`) par les schémas qui l'incorporent.
 *
 * Le téléphone y est OBLIGATOIRE : c'est la règle de l'adhésion. Un
 * parcours qui veut l'assouplir le remplace explicitement, avec
 * `.extend({ telephone: champTelephoneFacultatif(messages) })` — voir le
 * vote aux sondages. Un booléen en paramètre aurait été plus court, mais
 * TypeScript aurait alors typé le champ `string | undefined` PARTOUT, y
 * compris là où il est requis : la garantie aurait disparu du typage.
 */
export function creerIdentiteNouveauCompteSchema(messages: MessagesIdentiteNouveauCompte) {
  return z.object({
    prenom: z.string().trim().min(1, messages.prenomRequis).max(100),
    nom: z.string().trim().min(1, messages.nomRequis).max(100),
    email: z.string().trim().toLowerCase().email(messages.emailFormat),
    code_postal: z
      .string()
      .trim()
      .regex(/^\d{5}$/, messages.codePostalFormat),
    telephone: champTelephone(messages),
    date_naissance: creerDateNaissanceSchema(messages),
  });
}

/** Téléphone français, exigé. */
function champTelephone(messages: MessagesIdentiteNouveauCompte) {
  return z
    .string()
    .trim()
    .regex(/^(\+33|0)[1-9](\d{2}){4}$/, messages.telephoneFormat);
}

/**
 * Téléphone français, facultatif : la chaîne vide passe (c'est ce
 * qu'envoie un champ laissé en blanc), mais un numéro saisi reste validé
 * au format — on ne laisse pas entrer un numéro faux sous prétexte qu'il
 * était optionnel.
 *
 * Décision Lilou/Ben du 08/09/2026 : exigé pour adhérer (entrer dans le
 * mouvement, c'est accepter d'être joignable), facultatif pour voter — un
 * vote est un geste plus léger, et sur un mailing chaque champ
 * obligatoire de plus se paie en votes perdus.
 */
export function champTelephoneFacultatif(messages: MessagesIdentiteNouveauCompte) {
  return champTelephone(messages).optional().or(z.literal(''));
}

/**
 * Date de naissance, avec le seuil des 15 ans révolus (RGPD §5G, règle
 * aussi gravée dans la contrainte SQL `personne_age_minimum`).
 *
 * Reprend au caractère près la règle de l'inscription classique
 * (`creerDateNaissanceSchema` dans `lib/validations/auth.ts`), y compris
 * son décalage d'un jour : la date saisie est lue en UTC tandis que le
 * seuil est calculé en heure locale, si bien qu'un anniversaire tombant le
 * jour même ne passe que le lendemain en France. Décalage assumé, et
 * surtout IDENTIQUE partout : une seule règle d'âge, un seul comportement,
 * quelle que soit la porte d'entrée.
 */
function creerDateNaissanceSchema(messages: MessagesIdentiteNouveauCompte) {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, messages.dateFormat)
    .refine((iso) => {
      const naissance = new Date(iso);
      if (Number.isNaN(naissance.getTime())) {
        return false;
      }
      const aujourdHui = new Date();
      const seuil = new Date(
        aujourdHui.getFullYear() - AGE_MINIMUM_ANS,
        aujourdHui.getMonth(),
        aujourdHui.getDate(),
      );
      return naissance <= seuil;
    }, messages.ageMin);
}

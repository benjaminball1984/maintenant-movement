import { getSiteUrl } from '@/config/site';
import { cheminInterneOuDefaut } from '@/lib/auth/chemin-retour';
import { genererPassword } from '@/lib/generer-password';
import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase';

/**
 * Création d'un compte SANS mot de passe demandé (V2.6.141).
 *
 * Décisions Lilou/Ben du 08/09/2026 : « il faut pouvoir adhérer sans
 * compte, et l'adhésion crée un compte automatiquement », puis la même
 * chose pour le vote aux sondages. Le compte n'est plus une porte à
 * pousser avant le geste : il naît du geste.
 *
 * Ce module porte la mécanique commune aux deux parcours, pour qu'elle ne
 * soit écrite qu'une fois : création du compte Supabase Auth, ligne
 * `personne`, email de prise en main, et le cas « cette adresse a déjà un
 * compte ».
 *
 * ## Pourquoi aucun mot de passe n'est demandé
 *
 * En inventer un est le vrai coût d'une inscription, et il n'a rien à
 * faire au milieu d'un vote ou d'une adhésion. Le compte reçoit donc un
 * mot de passe aléatoire de 32 caractères que PERSONNE ne connaît, pas
 * même nous : il n'est ni affiché, ni envoyé, ni stocké ailleurs que dans
 * le hachage de Supabase Auth. La personne prend possession de son compte
 * par l'email de confirmation, puis se choisit un mot de passe par
 * « mot de passe oublié ».
 *
 * ## Pourquoi l'écriture passe par le client service_role
 *
 * À cet instant la personne n'a pas de session : `auth.uid()` vaut `null`,
 * et les policies RLS (`personne_insert_self`, `auth.uid() = id`)
 * refuseraient l'insertion. L'usage admin est borné à l'identifiant du
 * compte qu'on vient de créer : aucune identité d'autrui n'est touchée.
 */

/** Identité minimale d'une personne qui entre dans le mouvement. */
export interface IdentiteNouveauCompte {
  prenom: string;
  nom: string;
  email: string;
  code_postal: string;
  /**
   * Chaîne vide acceptée : le téléphone est exigé pour adhérer, facultatif
   * pour voter (décisions Lilou/Ben du 08/09/2026). Vide = colonne `null`,
   * jamais une chaîne vide en base.
   */
  telephone: string;
  /** ISO `AAAA-MM-JJ`. Le seuil des 15 ans est vérifié en amont par Zod. */
  date_naissance: string;
}

/**
 * Issue d'une tentative de création.
 *
 * `deja_compte` n'est pas un échec : c'est le refus délibéré d'écrire sous
 * l'identité de quelqu'un d'autre. Sans lui, connaître l'adresse email de
 * quelqu'un suffirait à le faire adhérer ou à voter à sa place.
 *
 * L'appelant propose alors de se connecter, avec un retour automatique sur
 * la page du geste (`?prochaine=`). Une première version envoyait un lien
 * magique par email : abandonnée le 08/09/2026 sur ce constat de Ben,
 * « euh, personne ne va faire ça » — ouvrir sa boîte mail au milieu d'un
 * vote, c'est perdre la personne.
 */
export type ResultatCreationCompte =
  | { etat: 'cree'; personneId: string }
  | { etat: 'deja_compte' }
  | { etat: 'echec'; message: string };

/**
 * Crée le compte, ou signale que l'adresse en a déjà un.
 *
 * @param identite Ce que la personne vient de saisir.
 */
export async function creerCompteSansMotDePasse(
  identite: IdentiteNouveauCompte,
): Promise<ResultatCreationCompte> {
  const admin = getSupabaseAdmin();

  const { data: creation, error: erreurCreation } = await admin.auth.admin.createUser({
    email: identite.email,
    password: genererPassword({ longueur: 32 }),
    // L'email reste à vérifier : c'est ce qui prouve que l'adresse
    // appartient bien à la personne (RGPD §5E), et c'est le lien qui lui
    // ouvre son compte.
    email_confirm: false,
  });

  if (erreurCreation !== null) {
    const dejaPris =
      erreurCreation.code === 'email_exists' ||
      erreurCreation.message.toLowerCase().includes('already been registered');
    if (!dejaPris) {
      return {
        etat: 'echec',
        message: `Création du compte impossible : ${erreurCreation.message}`,
      };
    }

    return { etat: 'deja_compte' };
  }

  const utilisateur = creation.user;

  const { error: erreurPersonne } = await admin.from('personne').insert({
    id: utilisateur.id,
    email: identite.email,
    nom: identite.nom,
    prenom: identite.prenom,
    code_postal: identite.code_postal,
    telephone: identite.telephone.trim() === '' ? null : identite.telephone,
    date_naissance: identite.date_naissance,
    email_verifie: false,
    statut: 'actif',
  });

  if (erreurPersonne !== null) {
    // Rien d'utilisable n'a été créé : on retire le compte auth plutôt que
    // de laisser une coquille sans profil.
    await admin.auth.admin.deleteUser(utilisateur.id);
    return { etat: 'echec', message: `Création du compte impossible : ${erreurPersonne.message}` };
  }

  return { etat: 'cree', personneId: utilisateur.id };
}

/**
 * Envoie l'email de prise en main du compte tout juste créé.
 *
 * **Best-effort, à appeler APRÈS avoir enregistré le geste** (adhésion,
 * vote) : une panne d'envoi ne doit jamais transformer un signal
 * politique enregistré en message d'erreur. Même doctrine que l'email de
 * confirmation de signature de pétition.
 */
export async function envoyerEmailPriseEnMain(email: string, retourApres: string): Promise<void> {
  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: urlDeRetour(retourApres) },
    });
    if (error !== null) {
      console.warn(
        '[creerCompteSansMotDePasse] email de prise en main non envoyé :',
        error.message,
      );
    }
  } catch (erreur) {
    console.warn('[creerCompteSansMotDePasse] email de prise en main non envoyé :', erreur);
  }
}

/**
 * Construit l'URL de retour du lien reçu par email.
 *
 * Le chemin est forcé INTERNE par `cheminInterneOuDefaut` : sans ça, un
 * `next` fabriqué transformerait un lien de connexion légitime en
 * redirection ouverte, donc en hameçonnage (revue sécurité S1).
 */
function urlDeRetour(retourApres: string): string {
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(cheminInterneOuDefaut(retourApres))}`;
}

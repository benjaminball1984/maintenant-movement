'use server';

import { journaliser } from '@/lib/admin/national/journal';
import {
  creerCompteSansMotDePasse,
  envoyerEmailPriseEnMain,
} from '@/lib/auth/creer-compte-sans-mot-de-passe';
import { getSession } from '@/lib/auth/session';
import { getEmailService } from '@/lib/email';
import { trancheAgeDepuisDateNaissance } from '@/lib/sondages/qualification';
import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { retirerSondageSchema } from '@/lib/validations/moderation';
import {
  type DonneesCreerSondage,
  type DonneesVoterSondage,
  type DonneesVoterSondageSansCompte,
  creerSondageSchema,
  voterSondageSansCompteSchema,
  voterSondageSchema,
} from '@/lib/validations/sondages';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions des Sondages (chantier 7.4).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §4D` : vote connecté obligatoire,
 * 2 modes (classique = vote brut ; pondéré = méthode des quotas dès
 * 300 répondant·es).
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

export async function creerSondage(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerSondageSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerSondage = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer un sondage.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUniqueSondage(donnees.titre, supabase);

  // Images d'options : on ne pose la colonne que si au moins une option est
  // réellement illustrée (sinon null, comme un sondage texte classique).
  const optionsImages =
    donnees.options_images?.some((u) => u !== null) === true ? donnees.options_images : null;

  // NB : pas de champ `mode` (revue 2026-06-12) : la colonne garde son défaut
  // en base, l'affichage bascule automatiquement selon le nombre de votes.
  const { error } = await supabase.from('sondage').insert({
    slug,
    titre: donnees.titre,
    question: donnees.question,
    options: donnees.options,
    options_images: optionsImages,
    choix_multiple: donnees.choix_multiple ?? false,
    image_url:
      donnees.image_url === '' || donnees.image_url === undefined ? null : donnees.image_url,
    commune_id:
      donnees.commune_id === '' || donnees.commune_id === undefined ? null : donnees.commune_id,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    createurice_id: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/s-informer/sondages');
  return { ok: true, slug };
}

export async function voterSondage(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = voterSondageSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesVoterSondage = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Vote connecté obligatoire (cf. doctrine §4D).' };
  }

  const supabase = await getSupabaseServer();
  const { data: sondage } = await supabase
    .from('sondage')
    .select('id, options, statut, choix_multiple')
    .eq('id', donnees.sondage_id)
    .maybeSingle();
  if (sondage === null) {
    return { ok: false, message: 'Sondage introuvable.' };
  }
  if (sondage.statut !== 'ouvert') {
    return { ok: false, message: 'Ce sondage n’est plus ouvert au vote.' };
  }

  const choix = resoudreChoix(sondage, donnees);
  if ('message' in choix) {
    return { ok: false, message: choix.message };
  }
  const { optionIndex, optionsChoisies } = choix;

  // Données « gratuites » du profil (revue 2026-06-12, Ben) : le code
  // postal n'est plus demandé au vote, il vient du profil de la personne
  // connectée ; la tranche d'âge est déduite de la date de naissance
  // quand elle n'est pas déclarée dans le formulaire.
  const { data: profil } = await supabase
    .from('personne')
    .select('code_postal, date_naissance')
    .eq('id', session.userId)
    .maybeSingle();
  const trancheDeclaree =
    donnees.tranche_age === '' || donnees.tranche_age === undefined ? null : donnees.tranche_age;
  const trancheAge =
    trancheDeclaree ?? trancheAgeDepuisDateNaissance(profil?.date_naissance ?? null);
  const genreDeclare =
    donnees.genre_declare === '' || donnees.genre_declare === undefined
      ? null
      : donnees.genre_declare;

  const { error } = await supabase.from('reponse_sondage').insert({
    sondage_id: sondage.id,
    personne_id: session.userId,
    option_index: optionIndex,
    options_choisies: optionsChoisies,
    code_postal: profil?.code_postal ?? null,
    tranche_age: trancheAge,
    pronom: null,
    genre_declare: genreDeclare,
  });
  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Tu as déjà voté pour ce sondage.' };
    }
    return { ok: false, message: `Vote impossible : ${error.message}` };
  }

  // Le genre déclaré au vote alimente aussi le profil de qualification
  // (best-effort : on ne re-posera pas la question du panel). Dégradation
  // propre tant que la table n'existe pas sur le distant.
  if (genreDeclare !== null) {
    await supabase
      .from('profil_qualification')
      .upsert(
        { personne_id: session.userId, question_cle: 'genre', reponse: genreDeclare },
        { onConflict: 'personne_id,question_cle' },
      );
  }

  revalidatePath('/s-informer/sondages');
  return { ok: true };
}

// ============================================================
// Vote SANS COMPTE (V2.6.141)
// ============================================================

/**
 * Ce que renvoie `voterSondageSansCompte` en cas de succès.
 *
 * `lien_envoye` : l'adresse a déjà un compte, on n'a donc rien écrit sous
 * l'identité de quelqu'un d'autre ; un lien de connexion est parti, et le
 * vote se fait au retour. Sans cette précaution, connaître l'adresse email
 * de quelqu'un suffirait à voter à sa place.
 */
export type IssueVoteSansCompte = { etat: 'vote' | 'lien_envoye' };

/**
 * Vote d'une personne sans compte : le compte est créé au passage
 * (décision Lilou/Ben du 08/09/2026).
 *
 * Ce qui change par rapport au vote connecté : rien, côté urne. La ligne
 * `reponse_sondage` porte un `personne_id` réel, la contrainte d'unicité
 * s'applique, le redressement reçoit code postal et tranche d'âge (déduite
 * de la date de naissance). Le mur tombe, la garantie reste.
 *
 * Le vote est enregistré AVANT tout envoi d'email : une panne de mail ne
 * doit jamais faire perdre une voix.
 */
export async function voterSondageSansCompte(
  donneesBrutes: unknown,
): Promise<ResultatAction<IssueVoteSansCompte>> {
  const parse = voterSondageSansCompteSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesVoterSondageSansCompte = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  // Déjà connecté·e : c'est le vote connecté qui s'applique, avec
  // l'identité du compte. Inatteignable par l'UI, mais l'action est
  // publique : elle doit se tenir seule.
  const session = await getSession();
  if (session !== null) {
    const resultat = await voterSondage({
      sondage_id: donnees.sondage_id,
      option_index: donnees.option_index,
      options_choisies: donnees.options_choisies,
      genre_declare: donnees.genre_declare,
      token_turnstile: donnees.token_turnstile,
    });
    return resultat.ok ? { ok: true, etat: 'vote' } : resultat;
  }

  const supabase = await getSupabaseServer();
  const { data: sondage } = await supabase
    .from('sondage')
    .select('id, slug, options, statut, choix_multiple')
    .eq('id', donnees.sondage_id)
    .maybeSingle();
  if (sondage === null) {
    return { ok: false, message: 'Sondage introuvable.' };
  }
  if (sondage.statut !== 'ouvert') {
    return { ok: false, message: 'Ce sondage n’est plus ouvert au vote.' };
  }

  // On vérifie le choix AVANT de créer quoi que ce soit : pas de compte
  // ouvert pour un vote qui n'aboutira pas.
  const choix = resoudreChoix(sondage, donnees);
  if ('message' in choix) {
    return { ok: false, message: choix.message };
  }

  const retour = `/s-informer/sondages/${sondage.slug}`;
  const compte = await creerCompteSansMotDePasse(
    {
      prenom: donnees.prenom,
      nom: donnees.nom,
      email: donnees.email,
      code_postal: donnees.code_postal,
      telephone: donnees.telephone,
      date_naissance: donnees.date_naissance,
    },
    retour,
  );

  if (compte.etat === 'echec') {
    return { ok: false, message: compte.message };
  }
  if (compte.etat === 'lien_envoye') {
    return { ok: true, etat: 'lien_envoye' };
  }

  const genreDeclare =
    donnees.genre_declare === '' || donnees.genre_declare === undefined
      ? null
      : donnees.genre_declare;

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('reponse_sondage').insert({
    sondage_id: sondage.id,
    personne_id: compte.personneId,
    option_index: choix.optionIndex,
    options_choisies: choix.optionsChoisies,
    code_postal: donnees.code_postal,
    tranche_age: trancheAgeDepuisDateNaissance(donnees.date_naissance),
    pronom: null,
    genre_declare: genreDeclare,
  });
  if (error !== null) {
    // Le compte est valide : on le garde et on envoie de quoi s'en servir.
    await envoyerEmailPriseEnMain(donnees.email, retour);
    return { ok: false, message: `Vote impossible : ${error.message}` };
  }

  if (genreDeclare !== null) {
    await admin
      .from('profil_qualification')
      .upsert(
        { personne_id: compte.personneId, question_cle: 'genre', reponse: genreDeclare },
        { onConflict: 'personne_id,question_cle' },
      );
  }

  // Le vote EXISTE. Le reste est best-effort.
  await envoyerEmailPriseEnMain(donnees.email, retour);

  if (donnees.accepte_newsletter) {
    try {
      await getEmailService().inscrireNewsletter(donnees.email, {
        origine: `sondage-${sondage.slug}`,
        action: `vote-${sondage.slug}`,
        departement: donnees.code_postal.slice(0, 2),
      });
    } catch (erreur) {
      console.warn('[voterSondageSansCompte] inscription newsletter échouée :', erreur);
    }
  }

  revalidatePath('/s-informer/sondages');
  return { ok: true, etat: 'vote' };
}

/**
 * Traduit ce que la personne a coché en ce qu'attend la base : un index
 * pour un choix unique, une liste dédupliquée pour un choix multiple.
 *
 * Partagé par le vote connecté et le vote sans compte : les bornes et les
 * messages doivent être les mêmes des deux côtés, sous peine de voir un
 * sondage accepter par une porte ce qu'il refuse par l'autre.
 */
function resoudreChoix(
  sondage: { options: string[]; choix_multiple: boolean | null },
  donnees: { option_index?: number; options_choisies?: number[] },
): { optionIndex: number | null; optionsChoisies: number[] | null } | { message: string } {
  const nbOptions = sondage.options.length;

  if (sondage.choix_multiple === true) {
    const choisies = [...new Set(donnees.options_choisies ?? [])];
    if (choisies.length === 0) {
      return { message: 'Choisis au moins une option.' };
    }
    if (choisies.some((i) => i < 0 || i >= nbOptions)) {
      return { message: 'Option hors plage pour ce sondage.' };
    }
    return { optionIndex: null, optionsChoisies: choisies };
  }

  if (donnees.option_index === undefined || donnees.option_index >= nbOptions) {
    return { message: 'Option hors plage pour ce sondage.' };
  }
  return { optionIndex: donnees.option_index, optionsChoisies: null };
}

// ============================================================
// Retrait d'un sondage (modération a posteriori, admin)
// ============================================================
export async function retirerSondage(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerSondageSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  // Droit de modération sur l'onglet Sondages (ou admin général).
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    const { data: estMod } = await supabase.rpc('est_moderateurice', {
      onglet_demande: 'sondages',
    });
    if (estMod !== true) {
      return { ok: false, message: 'Droit de modération requis.' };
    }
  }

  const { data: avant } = await supabase
    .from('sondage')
    .select('id, statut')
    .eq('id', donnees.sondage_id)
    .maybeSingle();
  if (avant === null) {
    return { ok: false, message: 'Sondage introuvable.' };
  }
  if (avant.statut === 'retire') {
    return { ok: false, message: 'Ce sondage est déjà retiré.' };
  }

  const { error } = await supabase
    .from('sondage')
    .update({ statut: 'retire' })
    .eq('id', donnees.sondage_id);
  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  await journaliser({
    action: 'sondage.retire',
    cibleTable: 'sondage',
    cibleId: donnees.sondage_id,
    ancienEtat: { statut: avant.statut },
    nouvelEtat: { statut: 'retire', raison: donnees.raison },
  });

  revalidatePath('/s-informer/sondages');
  revalidatePath('/admin/moderation/sondages');
  return { ok: true };
}

async function genererSlugUniqueSondage(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(titre);
  if (base === '') return `sondage-${Date.now()}`;
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('sondage')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

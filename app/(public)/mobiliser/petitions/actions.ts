'use server';

import { getSiteUrl } from '@/config/site';
import { journaliser } from '@/lib/admin/national/journal';
import { getSession } from '@/lib/auth/session';
import { getEmailService } from '@/lib/email';
import { envoyerEmailTemplee } from '@/lib/email-templates';
import { MESSAGES_VALIDATION_PETITION_DEFAUT } from '@/lib/messages-validation';
import { droitsGestionSignatures } from '@/lib/petitions/gestion-signatures';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesCreerPetition,
  type DonneesEditerPetition,
  type DonneesModererPetition,
  type DonneesSignerPetition,
  creerPetitionSchema,
  editerPetitionSchema,
  modererPetitionSchema,
  modifierSignatureSchema,
  retirerSignatureSchema,
  signatureCibleSchema,
  signerPetitionSchema,
  slugifierTitre,
} from '@/lib/validations/petition';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

/**
 * Server Actions du sous-espace Pétitions (chantier 3.1).
 *
 * Toutes utilisent le pattern `ResultatAction` (cf. 1.2, 1.3) :
 *   `{ ok: true; ... } | { ok: false; message: string }`.
 *
 * RLS Supabase (cf. migrations 012 + 013) reste la dernière ligne de
 * défense. La validation Zod + Turnstile + check de session côté Server
 * Action sert surtout l'UX (messages clairs en français).
 */
export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Création d'une pétition (auth requise, statut = en_moderation)
// ============================================================
export async function creerPetition(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string; id: string }>> {
  const parse = creerPetitionSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerPetition = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une pétition.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUnique(donnees.titre, supabase);

  // V2.5.53 : sanitize HTML riche optionnel avant insertion.
  const texteHtmlPropre =
    donnees.texte_html !== undefined && donnees.texte_html.trim() !== ''
      ? sanitizeRichHtml(donnees.texte_html)
      : null;

  const { data: creee, error } = await supabase
    .from('petition')
    .insert({
      slug,
      titre: donnees.titre,
      texte: donnees.texte,
      texte_html: texteHtmlPropre,
      destinataire: donnees.destinataire,
      image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
      objectif: donnees.objectif,
      createurice_id: session.userId,
      statut: 'en_moderation',
    })
    .select('id')
    .single();

  if (error !== null || creee === null) {
    return { ok: false, message: `Création impossible : ${error?.message ?? ''}` };
  }

  revalidatePath('/mobiliser/petitions');
  return { ok: true, slug, id: creee.id };
}

// ============================================================
// Signature d'une pétition (anonyme ou connectée)
// ============================================================
export async function signerPetition(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = signerPetitionSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesSignerPetition = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const supabase = await getSupabaseServer();
  const session = await getSession();

  const { data: petition, error: erreurLecture } = await supabase
    .from('petition')
    .select('id, statut, createurice_id, slug, titre')
    .eq('id', donnees.petition_id)
    .maybeSingle();

  if (erreurLecture !== null || petition === null) {
    return { ok: false, message: 'Pétition introuvable.' };
  }
  if (petition.statut !== 'publiee') {
    return { ok: false, message: 'Cette pétition n’est pas (ou plus) ouverte aux signatures.' };
  }

  // Identité durable du signataire : on rattache la signature à un profil
  // unifié (numéro M+7 stable, cf. chantier 13.3-E), même sans compte. Quand
  // la personne créera son compte avec ce même email, ses signatures
  // remonteront dans « Mes contributions ».
  const profilUnifieId = await rattacherProfilUnifie(donnees.email);

  // V2.6.134 : signature au nom d'une organisation. Les champs `organisation_*`
  // ne sont écrits que dans ce cas — la contrainte SQL `signature_type_coherent`
  // exige qu'ils soient nuls pour une signature individuelle.
  const signeAuNomDUneOrganisation = donnees.type_signataire === 'organisation';

  // V2.6.138 : une signature individuelle peut porter un pseudonyme à la place
  // du nom civil. Le schéma Zod garantit qu'au moins l'un des deux est là ;
  // ici on se contente de traduire « champ vide » en « absent » pour la base.
  const enTexteOuNull = (valeur: string | undefined): string | null =>
    valeur === undefined || valeur.trim() === '' ? null : valeur.trim();

  const pseudonyme = signeAuNomDUneOrganisation ? null : enTexteOuNull(donnees.pseudonyme);
  const champsOrganisation = signeAuNomDUneOrganisation
    ? {
        type_signataire: 'organisation' as const,
        organisation_nom: donnees.organisation_nom?.trim() ?? null,
        organisation_categorie:
          donnees.organisation_categorie === '' ? null : (donnees.organisation_categorie ?? null),
        organisation_territoire:
          donnees.organisation_territoire === '' ? null : (donnees.organisation_territoire ?? null),
        signataire_fonction:
          donnees.signataire_fonction === '' ? null : (donnees.signataire_fonction ?? null),
        organisation_affichage_public: donnees.organisation_affichage_public !== false,
      }
    : { type_signataire: 'individu' as const };

  const { error: erreurInsert } = await supabase.from('signature_petition').insert({
    petition_id: petition.id,
    personne_id: session?.userId ?? null,
    profil_unifie_id: profilUnifieId,
    nom: enTexteOuNull(donnees.nom),
    prenom: enTexteOuNull(donnees.prenom),
    pseudonyme,
    email: donnees.email,
    code_postal: donnees.code_postal,
    telephone: donnees.telephone === '' ? null : (donnees.telephone ?? null),
    accepte_newsletter: donnees.accepte_newsletter,
    accepte_contact_createurice: donnees.accepte_contact_createurice,
    ...champsOrganisation,
  });

  if (erreurInsert !== null) {
    // Code Postgres 23505 = violation contrainte unique : le signal a déjà
    // été enregistré. Le message diffère selon ce qui est en doublon : une
    // adresse email pour un individu, un nom d'organisation sinon.
    if (erreurInsert.code === '23505') {
      return {
        ok: false,
        message: signeAuNomDUneOrganisation
          ? 'Cette organisation a déjà signé. Si c’est une erreur, écris-nous.'
          : 'Tu as déjà signé cette pétition avec cet email.',
      };
    }
    return { ok: false, message: `Signature impossible : ${erreurInsert.message}` };
  }

  // Newsletter : best-effort. Si l'inscription échoue, la signature
  // est quand même enregistrée (on ne perd pas le signal politique
  // pour une erreur d'envoi).
  if (donnees.accepte_newsletter) {
    try {
      const departement = donnees.code_postal.slice(0, 2);
      await getEmailService().inscrireNewsletter(donnees.email, {
        origine: `petition-${petition.slug}`,
        action: `signature-${petition.slug}`,
        departement,
      });
    } catch (erreur) {
      console.warn('[signerPetition] inscription newsletter échouée :', erreur);
    }
  }

  // Confirmation de signature (16/08/2026, demande Ben). La modale annonçait
  // « Tu vas recevoir un email pour confirmer » alors qu'aucun email ne
  // partait : le site promettait ce qu'il ne faisait pas.
  //
  // Best-effort, comme la newsletter juste au-dessus : si Brevo est
  // indisponible, la signature reste enregistrée. On ne perd jamais un
  // signal politique pour un échec d'envoi.
  try {
    const { data: total } = await supabase.rpc('nombre_signatures', {
      petition_a_compter: petition.id,
    });
    await envoyerEmailTemplee('petition_signee', donnees.email, {
      // On appelle la personne par ce qu'elle a donné : son prénom, ou le
      // pseudonyme qu'elle a choisi. Jamais un « Bonjour , » vide.
      prenom: enTexteOuNull(donnees.prenom) ?? pseudonyme ?? '',
      petition_titre: petition.titre,
      petition_url: `${getSiteUrl()}/mobiliser/petitions/${petition.slug}`,
      nombre_signatures:
        typeof total === 'number' ? new Intl.NumberFormat('fr-FR').format(total) : '',
    });
  } catch (erreur) {
    console.warn('[signerPetition] email de confirmation non envoyé :', erreur);
  }

  // PAS de `revalidatePath` ici — volontaire, corrigé le 16/08/2026.
  //
  // Signalé par Ben : « quand on signe, la page adhérer apparaît un dixième
  // de seconde et hop, disparu ». Cause : revalider la page depuis l'action
  // déclenche un rafraîchissement de la route **pendant que la fenêtre de
  // remerciement est ouverte**. Le `<dialog>` est reconstruit par React,
  // perd son état « ouvert », et le tunnel d'adhésion disparaît avant
  // d'avoir pu être lu.
  //
  // Le compteur de signatures est donc rafraîchi à la FERMETURE de la
  // fenêtre, par `router.refresh()` dans `ModaleSignaturePetition`. La
  // personne voit son remerciement en entier, puis le compteur à jour.
  return { ok: true };
}

// ============================================================
// Modération a priori (admin uniquement)
// ============================================================
export async function modererPetition(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = modererPetitionSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesModererPetition = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  // Vérification du droit côté Server Action (en plus de la RLS qui
  // filtrera de toute façon). Permet un message clair.
  if (!(await aDroitModerationPetitions(supabase))) {
    return { ok: false, message: 'Droit de modération requis.' };
  }

  const { error } = await supabase
    .from('petition')
    .update({
      statut: donnees.decision,
      modere_par: session.userId,
      modere_le: new Date().toISOString(),
      raison_rejet: donnees.decision === 'rejetee' ? (donnees.raison_rejet ?? null) : null,
    })
    .eq('id', donnees.petition_id);

  if (error !== null) {
    return { ok: false, message: `Modération impossible : ${error.message}` };
  }

  // C6 (revue 2026) : trace l'acte de modération dans le journal d'audit.
  await journaliser({
    action: 'petition.moderation',
    cibleTable: 'petition',
    cibleId: donnees.petition_id,
    nouvelEtat: {
      decision: donnees.decision,
      raison_rejet: donnees.decision === 'rejetee' ? (donnees.raison_rejet ?? null) : null,
    },
  });

  revalidatePath('/admin/moderation/petitions');
  revalidatePath('/mobiliser/petitions');
  return { ok: true };
}

// ============================================================
// Archivage d'une pétition (admin)
// ============================================================
/**
 * Archive une pétition : statut → 'archivee'. Elle disparaît de l'UI
 * publique mais reste en base (signatures conservées, doctrine §0.3
 * « on additionne, on ne soustrait jamais »). Réservé aux personnes
 * avec droit de modération pétitions.
 *
 * Idempotent : ré-archiver une pétition déjà archivée ne fait rien.
 */
export async function archiverPetition(donneesBrutes: unknown): Promise<ResultatAction> {
  const parsed = z
    .object({
      petition_id: z.string().uuid(),
      raison: z.string().min(1).max(500).optional(),
    })
    .safeParse(donneesBrutes);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Données invalides.' };
  }

  const session = await getSession();
  if (session === null) return { ok: false, message: 'Authentification requise.' };

  const supabase = await getSupabaseServer();
  if (!(await aDroitModerationPetitions(supabase))) {
    return { ok: false, message: 'Droit de modération requis.' };
  }

  const { error } = await supabase
    .from('petition')
    .update({
      statut: 'archivee',
      modere_par: session.userId,
      modere_le: new Date().toISOString(),
      raison_rejet: parsed.data.raison ?? null,
    })
    .eq('id', parsed.data.petition_id);

  if (error !== null) return { ok: false, message: `Archivage impossible : ${error.message}` };

  revalidatePath('/admin/petitions');
  revalidatePath('/mobiliser/petitions');
  revalidatePath('/admin/moderation/petitions');
  return { ok: true };
}

// ============================================================
// Édition d'une pétition par l'équipe (admin / modération)
// ============================================================
export async function editerPetition(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = editerPetitionSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesEditerPetition = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  if (!(await aDroitModerationPetitions(supabase))) {
    return { ok: false, message: 'Droit de modération requis.' };
  }

  // Chaîne vide -> null (pas de date). Sinon on garde la date `AAAA-MM-JJ`
  // que Postgres interprète sans ambiguïté en `timestamptz`.
  const { data: maj, error } = await supabase
    .from('petition')
    .update({
      titre: donnees.titre,
      texte: donnees.texte,
      destinataire: donnees.destinataire,
      image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
      objectif: donnees.objectif,
      date_lancement: donnees.date_lancement ? donnees.date_lancement : null,
      date_echeance: donnees.date_echeance ? donnees.date_echeance : null,
    })
    .eq('id', donnees.petition_id)
    .select('slug')
    .maybeSingle();

  if (error !== null) {
    return { ok: false, message: `Édition impossible : ${error.message}` };
  }

  revalidatePath('/admin/petitions');
  revalidatePath('/mobiliser/petitions');
  if (maj?.slug) {
    revalidatePath(`/mobiliser/petitions/${maj.slug}`);
  }
  return { ok: true };
}

// ============================================================
// Helpers internes
// ============================================================

/**
 * Trouve (ou crée) le profil unifié d'un email et renvoie son id, pour
 * rattacher la signature à une identité durable (numéro M+7, chantier 13.3-E).
 *
 * Passe par la fonction SQL `trouver_ou_creer_profil_unifie`, réservée au
 * client service_role (les écritures sur `profil_unifie` ne sont pas ouvertes
 * au public). Best-effort : si la migration 038 n'est pas encore appliquée, on
 * renvoie `null` et la signature est tout de même enregistrée (dégradation
 * propre, même logique que l'inscription newsletter).
 */
async function rattacherProfilUnifie(email: string): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc('trouver_ou_creer_profil_unifie', {
      email_cible: email.trim(),
    });
    if (error !== null) {
      console.warn('[signerPetition] profil unifié indisponible :', error.message);
      return null;
    }
    return data ?? null;
  } catch (erreur) {
    console.warn('[signerPetition] profil unifié indisponible :', erreur);
    return null;
  }
}

/**
 * True si la personne connectée peut modérer/éditer les pétitions :
 * droit de modération sur l'onglet `petitions`, ou admin général (national
 * ou admin). Centralisé pour `modererPetition` et `editerPetition`.
 *
 * La RLS reste la barrière réelle ; ce check sert un message clair côté UI.
 */
async function aDroitModerationPetitions(supabase: ClientSupabase): Promise<boolean> {
  const { data: aDroitMod } = await supabase.rpc('est_moderateurice', {
    onglet_demande: 'petitions',
  });
  if (aDroitMod === true) {
    return true;
  }
  const { data: aDroitGeneral } = await supabase.rpc('est_admin_general');
  return aDroitGeneral === true;
}

/**
 * Génère un slug unique à partir du titre. Si le slug initial existe
 * déjà, on suffixe avec `-2`, `-3`, etc. jusqu'à trouver un libre.
 * Pratique : sur 1000 collisions on s'arrête (limite de sûreté).
 */
async function genererSlugUnique(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitre(titre);
  if (base === '') {
    return `petition-${Date.now()}`;
  }

  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('petition')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);

    if ((count ?? 0) === 0) {
      return candidat;
    }
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Redirection vers la page d'une pétition. Exporté pour utilisation
 * depuis les formulaires de création (qui veulent rediriger sur succès).
 */
export async function redirectVersPetition(slug: string): Promise<never> {
  redirect(`/mobiliser/petitions/${slug}`);
}

// ============================================================
// Gestion des signatures (V2.6.139) : corriger, retirer, supprimer
// ============================================================
//
// Demande de Lilou/Ben du 03/09/2026. Deux niveaux de droit :
//   - administration (admin général ou modération « petitions ») : tout,
//     y compris la suppression définitive ;
//   - créateurice de la pétition : corriger et retirer, rien de plus.
//
// Le RETRAIT est réversible et conserve la ligne (doctrine de greffe §0.3).
// La SUPPRESSION définitive existe pour le seul cas qui l'exige : une demande
// d'effacement au titre du RGPD. Elle est réservée à l'administration.
//
// Chaque geste est tracé dans le journal d'audit, y compris quand il vient
// d'une créatrice non-admin : une signature qui disparaît doit toujours
// pouvoir être expliquée.

/** Signature lue avant modification, avec le slug de sa pétition. */
interface SignatureCiblee {
  id: string;
  petition_id: string;
  petition_slug: string;
  type_signataire: string;
  nom: string | null;
  prenom: string | null;
  pseudonyme: string | null;
  organisation_nom: string | null;
  organisation_categorie: string | null;
  organisation_territoire: string | null;
  organisation_affichage_public: boolean;
  retiree_le: string | null;
}

/**
 * Charge la signature visée et vérifie que la personne courante a le droit
 * d'agir dessus. Facteur commun des quatre actions ci-dessous.
 */
async function chargerSignatureAutorisee(
  signatureId: string,
): Promise<
  | { ok: true; signature: SignatureCiblee; estAdministration: boolean }
  | { ok: false; message: string }
> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('signature_petition')
    .select(
      'id, petition_id, type_signataire, nom, prenom, pseudonyme, organisation_nom, organisation_categorie, organisation_territoire, organisation_affichage_public, retiree_le, petition(slug)',
    )
    .eq('id', signatureId)
    .maybeSingle();

  if (error !== null || data === null) {
    return { ok: false, message: 'Signature introuvable.' };
  }

  const droits = await droitsGestionSignatures(data.petition_id);
  if (!droits.peutGerer) {
    return {
      ok: false,
      message: 'Seule l’équipe ou la personne qui a lancé ce texte peut gérer ses signatures.',
    };
  }

  // biome-ignore lint/suspicious/noExplicitAny: jointure imbriquée non typée précisément.
  const petitionJointe = (data as any).petition as { slug: string } | null;

  return {
    ok: true,
    estAdministration: droits.estAdministration,
    signature: {
      id: data.id,
      petition_id: data.petition_id,
      petition_slug: petitionJointe?.slug ?? '',
      type_signataire: data.type_signataire,
      nom: data.nom,
      prenom: data.prenom,
      pseudonyme: data.pseudonyme,
      organisation_nom: data.organisation_nom,
      organisation_categorie: data.organisation_categorie,
      organisation_territoire: data.organisation_territoire,
      organisation_affichage_public: data.organisation_affichage_public,
      retiree_le: data.retiree_le,
    },
  };
}

/** Rafraîchit la fiche publique et la console admin après un geste de gestion. */
function revaliderApresGestion(slug: string): void {
  if (slug !== '') {
    revalidatePath(`/mobiliser/petitions/${slug}`);
  }
  revalidatePath('/mobiliser/petitions');
  revalidatePath('/admin/petitions');
}

/** Chaîne vide ou absente devient `null` : c'est ce que la base attend. */
function texteOuNull(valeur: string | undefined): string | null {
  return valeur === undefined || valeur.trim() === '' ? null : valeur.trim();
}

/**
 * Corrige l'identité affichée d'une signature (faute de frappe dans un nom
 * d'organisation, prénom mal orthographié, territoire à préciser).
 *
 * Ni l'email ni le type de signataire ne sont modifiables : voir le
 * commentaire du schéma `modifierSignatureSchema`.
 */
export async function modifierSignature(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = modifierSignatureSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const cible = await chargerSignatureAutorisee(donnees.signature_id);
  if (!cible.ok) return cible;

  const messages = MESSAGES_VALIDATION_PETITION_DEFAUT;
  const nom = texteOuNull(donnees.nom);
  const prenom = texteOuNull(donnees.prenom);
  const pseudonyme = texteOuNull(donnees.pseudonyme);
  const organisationNom = texteOuNull(donnees.organisation_nom);
  const organisationCategorie = texteOuNull(donnees.organisation_categorie);

  // La cohérence se vérifie contre le type RÉEL de la signature, lu en base,
  // et non contre un champ envoyé par le navigateur.
  if (cible.signature.type_signataire === 'organisation') {
    if (nom === null || prenom === null) {
      return { ok: false, message: messages.prenomRequis };
    }
    if (pseudonyme !== null) {
      return { ok: false, message: messages.pseudonymeInterditOrganisation };
    }
    if (organisationNom === null) {
      return { ok: false, message: messages.organisationNomRequis };
    }
    if (organisationCategorie === null) {
      return { ok: false, message: messages.organisationCategorieRequise };
    }
  } else if ((nom === null || prenom === null) && pseudonyme === null) {
    return { ok: false, message: messages.identiteOuPseudonymeRequis };
  }

  const nouvelEtat =
    cible.signature.type_signataire === 'organisation'
      ? {
          nom,
          prenom,
          pseudonyme: null,
          organisation_nom: organisationNom,
          organisation_categorie: organisationCategorie,
          organisation_territoire: texteOuNull(donnees.organisation_territoire),
          organisation_affichage_public: donnees.organisation_affichage_public !== false,
        }
      : { nom, prenom, pseudonyme };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('signature_petition')
    .update(nouvelEtat)
    .eq('id', donnees.signature_id);

  if (error !== null) {
    if (error.code === '23505') {
      return {
        ok: false,
        message: 'Une autre signature porte déjà ce nom d’organisation sur ce texte.',
      };
    }
    return { ok: false, message: `Correction impossible : ${error.message}` };
  }

  await journaliser({
    action: 'signature_petition.modifiee',
    cibleTable: 'signature_petition',
    cibleId: donnees.signature_id,
    ancienEtat: {
      nom: cible.signature.nom,
      prenom: cible.signature.prenom,
      pseudonyme: cible.signature.pseudonyme,
      organisation_nom: cible.signature.organisation_nom,
      organisation_categorie: cible.signature.organisation_categorie,
      organisation_territoire: cible.signature.organisation_territoire,
      organisation_affichage_public: cible.signature.organisation_affichage_public,
    },
    nouvelEtat,
  });

  revaliderApresGestion(cible.signature.petition_slug);
  return { ok: true };
}

/**
 * Retire une signature : elle ne compte plus, elle disparaît des listes, mais
 * sa ligne reste en base et le geste est réversible.
 */
export async function retirerSignature(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerSignatureSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const cible = await chargerSignatureAutorisee(donnees.signature_id);
  if (!cible.ok) return cible;

  if (cible.signature.retiree_le !== null) {
    return { ok: false, message: 'Cette signature est déjà retirée.' };
  }

  const session = await getSession();
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('signature_petition')
    .update({
      retiree_le: new Date().toISOString(),
      retiree_par: session?.userId ?? null,
      raison_retrait: donnees.raison,
    })
    .eq('id', donnees.signature_id);

  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  await journaliser({
    action: 'signature_petition.retiree',
    cibleTable: 'signature_petition',
    cibleId: donnees.signature_id,
    nouvelEtat: { raison_retrait: donnees.raison },
  });

  revaliderApresGestion(cible.signature.petition_slug);
  return { ok: true };
}

/** Annule un retrait : la signature recompte, comme avant. */
export async function restaurerSignature(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = signatureCibleSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }

  const cible = await chargerSignatureAutorisee(parse.data.signature_id);
  if (!cible.ok) return cible;

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('signature_petition')
    .update({ retiree_le: null, retiree_par: null, raison_retrait: null })
    .eq('id', parse.data.signature_id);

  if (error !== null) {
    // 23505 : quelqu'un a re-signé entre-temps avec la même adresse (ou le
    // même nom d'organisation), et l'anti-doublon ne laisse pas deux
    // signatures actives identiques.
    if (error.code === '23505') {
      return {
        ok: false,
        message:
          'Impossible de restaurer : une signature active porte déjà cette adresse ou ce nom d’organisation.',
      };
    }
    return { ok: false, message: `Restauration impossible : ${error.message}` };
  }

  await journaliser({
    action: 'signature_petition.restauree',
    cibleTable: 'signature_petition',
    cibleId: parse.data.signature_id,
  });

  revaliderApresGestion(cible.signature.petition_slug);
  return { ok: true };
}

/**
 * Supprime définitivement une signature. Irréversible.
 *
 * Réservé à l'administration, et pensé pour un seul cas : une personne demande
 * l'effacement de ses données. Pour tout le reste (insulte, doublon, erreur),
 * le retrait suffit et se répare.
 */
export async function supprimerSignatureDefinitivement(
  donneesBrutes: unknown,
): Promise<ResultatAction> {
  const parse = signatureCibleSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }

  const cible = await chargerSignatureAutorisee(parse.data.signature_id);
  if (!cible.ok) return cible;

  if (!cible.estAdministration) {
    return {
      ok: false,
      message:
        'La suppression définitive est réservée à l’équipe. Tu peux retirer la signature : elle ne compte plus, et le geste reste réparable.',
    };
  }

  // Journalisé AVANT la suppression : après, la ligne n'existe plus et on ne
  // saurait plus dire ce qui a disparu.
  await journaliser({
    action: 'signature_petition.supprimee_definitivement',
    cibleTable: 'signature_petition',
    cibleId: parse.data.signature_id,
    ancienEtat: {
      type_signataire: cible.signature.type_signataire,
      organisation_nom: cible.signature.organisation_nom,
      pseudonyme: cible.signature.pseudonyme,
    },
  });

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('signature_petition')
    .delete()
    .eq('id', parse.data.signature_id);

  if (error !== null) {
    return { ok: false, message: `Suppression impossible : ${error.message}` };
  }

  revaliderApresGestion(cible.signature.petition_slug);
  return { ok: true };
}

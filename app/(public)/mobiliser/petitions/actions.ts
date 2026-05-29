'use server';

import { getSession } from '@/lib/auth/session';
import { getEmailService } from '@/lib/email';
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
): Promise<ResultatAction<{ slug: string }>> {
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

  // V2.5.53 — sanitize HTML riche optionnel avant insertion.
  const texteHtmlPropre =
    donnees.texte_html !== undefined && donnees.texte_html.trim() !== ''
      ? sanitizeRichHtml(donnees.texte_html)
      : null;

  const { error } = await supabase.from('petition').insert({
    slug,
    titre: donnees.titre,
    texte: donnees.texte,
    texte_html: texteHtmlPropre,
    destinataire: donnees.destinataire,
    image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
    objectif: donnees.objectif,
    createurice_id: session.userId,
    statut: 'en_moderation',
  });

  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/mobiliser/petitions');
  return { ok: true, slug };
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
    .select('id, statut, createurice_id, slug')
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

  const { error: erreurInsert } = await supabase.from('signature_petition').insert({
    petition_id: petition.id,
    personne_id: session?.userId ?? null,
    profil_unifie_id: profilUnifieId,
    nom: donnees.nom,
    prenom: donnees.prenom,
    email: donnees.email,
    code_postal: donnees.code_postal,
    telephone: donnees.telephone === '' ? null : (donnees.telephone ?? null),
    accepte_newsletter: donnees.accepte_newsletter,
    accepte_contact_createurice: donnees.accepte_contact_createurice,
  });

  if (erreurInsert !== null) {
    // Code Postgres 23505 = violation contrainte unique : la personne a
    // déjà signé. On retourne un message clair, pas une erreur technique.
    if (erreurInsert.code === '23505') {
      return { ok: false, message: 'Tu as déjà signé cette pétition avec cet email.' };
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

  revalidatePath(`/mobiliser/petitions/${petition.slug}`);
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

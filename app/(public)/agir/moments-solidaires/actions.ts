'use server';

import { getSession } from '@/lib/auth/session';
import { SEPT_RDV } from '@/lib/moments/config';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import {
  type DonneesAjouterTupperware,
  type DonneesCreerMomentSolidaire,
  type DonneesMarquerTupperwareRendu,
  type DonneesParticiperMoment,
  ajouterTupperwareSchema,
  creerMomentSolidaireSchema,
  marquerTupperwareRenduSchema,
  participerMomentSchema,
} from '@/lib/validations/moments';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions des Moments solidaires (chantier 5.3).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7C`.
 *
 * Particularités :
 *   - le type `porte_a_porte` génère 7 lignes enfants au moment de la
 *     création, une par sous-type (cf. `SEPT_RDV` dans
 *     `lib/moments/config.ts`).
 *   - les coordonnées de participation restent strictement réservées
 *     à l'organisateurice + admin (cf. RLS `participation_moment`).
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Création d'un moment (avec génération auto des 7 RDV si porte-à-porte)
// ============================================================

export async function creerMomentSolidaire(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerMomentSolidaireSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerMomentSolidaire = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour organiser un moment.' };
  }

  const supabase = await getSupabaseServer();

  // Permission : organiser = membre de la commune territoriale (cf.
  // spec §7C). Si une commune est précisée, on vérifie.
  if (donnees.commune_id !== '' && donnees.commune_id !== undefined) {
    const { data: estMembre } = await supabase.rpc('est_membre_commune', {
      commune_a_verifier: donnees.commune_id,
    });
    if (estMembre !== true) {
      return {
        ok: false,
        message:
          'Pour organiser un moment dans cette commune, il faut en être membre actif·ve. Cf. doctrine §7C.',
      };
    }
  }

  const slug = await genererSlugUniqueMoment(donnees.titre, supabase);
  const communeId =
    donnees.commune_id === '' || donnees.commune_id === undefined ? null : donnees.commune_id;
  const causeLocale =
    donnees.cause_locale === '' || donnees.cause_locale === undefined ? null : donnees.cause_locale;
  const termineLe =
    donnees.termine_le === '' || donnees.termine_le === undefined ? null : donnees.termine_le;

  const { data: moment, error } = await supabase
    .from('moment_solidaire')
    .insert({
      slug,
      titre: donnees.titre,
      description: donnees.description,
      type: donnees.type,
      lieu: donnees.lieu,
      latitude: donnees.latitude ?? null,
      longitude: donnees.longitude ?? null,
      commence_le: donnees.commence_le,
      termine_le: termineLe,
      commune_id: communeId,
      cause_locale: causeLocale,
      capacite_max: donnees.capacite_max ?? null,
      createurice_id: session.userId,
    })
    .select('id')
    .single();

  if (error !== null || moment === null) {
    return { ok: false, message: `Création impossible : ${error?.message ?? ''}` };
  }

  // Génération auto des 7 RDV pour le porte-à-porte.
  if (donnees.type === 'porte_a_porte') {
    const debut = new Date(donnees.commence_le);
    for (const rdv of SEPT_RDV) {
      const date = new Date(debut.getTime() + rdv.decalageJours * 24 * 60 * 60 * 1000);
      const slugRdv = await genererSlugUniqueMoment(`${donnees.titre} ${rdv.libelle}`, supabase);
      await supabase.from('moment_solidaire').insert({
        slug: slugRdv,
        titre: `${rdv.libelle} — ${donnees.titre}`,
        description: rdv.description,
        type: 'porte_a_porte',
        sous_type: rdv.sous_type,
        parent_id: moment.id,
        lieu: donnees.lieu,
        latitude: donnees.latitude ?? null,
        longitude: donnees.longitude ?? null,
        commence_le: date.toISOString(),
        commune_id: communeId,
        cause_locale: causeLocale,
        createurice_id: session.userId,
      });
    }
  }

  revalidatePath('/agir/moments-solidaires');
  return { ok: true, slug };
}

// ============================================================
// Participation
// ============================================================

export async function participerMoment(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = participerMomentSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesParticiperMoment = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  const supabase = await getSupabaseServer();

  const { error } = await supabase.from('participation_moment').insert({
    moment_id: donnees.moment_id,
    personne_id: session?.userId ?? null,
    prenom: donnees.prenom === '' ? null : (donnees.prenom ?? null),
    email: donnees.email === '' ? null : (donnees.email ?? null),
    telephone: donnees.telephone === '' ? null : (donnees.telephone ?? null),
  });
  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Tu participes déjà à ce moment.' };
    }
    return { ok: false, message: `Participation impossible : ${error.message}` };
  }

  return { ok: true };
}

// ============================================================
// Tracker Tupperwares (organisateurice du moment)
// ============================================================

export async function ajouterTupperware(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = ajouterTupperwareSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAjouterTupperware = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  const { error } = await supabase.from('tupperware').insert({
    moment_id: donnees.moment_id,
    porteureuse_prenom: donnees.porteureuse_prenom,
    porteureuse_email:
      donnees.porteureuse_email === '' ? null : (donnees.porteureuse_email ?? null),
    porteureuse_telephone:
      donnees.porteureuse_telephone === '' ? null : (donnees.porteureuse_telephone ?? null),
    contenu: donnees.contenu === '' ? null : (donnees.contenu ?? null),
  });
  if (error !== null) {
    return { ok: false, message: `Ajout impossible : ${error.message}` };
  }
  revalidatePath('/agir/moments-solidaires');
  return { ok: true };
}

export async function marquerTupperwareRendu(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = marquerTupperwareRenduSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesMarquerTupperwareRendu = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('tupperware')
    .update({ statut: 'rendu', rendu_le: new Date().toISOString() })
    .eq('id', donnees.tupperware_id);
  if (error !== null) {
    return { ok: false, message: `Mise à jour impossible : ${error.message}` };
  }
  revalidatePath('/agir/moments-solidaires');
  return { ok: true };
}

// ============================================================
// Helpers internes
// ============================================================

async function genererSlugUniqueMoment(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(titre);
  if (base === '') return `moment-${Date.now()}`;
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('moment_solidaire')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

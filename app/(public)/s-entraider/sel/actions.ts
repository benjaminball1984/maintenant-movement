'use server';

import { journaliser } from '@/lib/admin/national/journal';
import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { getT99CPService } from '@/lib/t99cp';
import { getTurnstileService } from '@/lib/turnstile';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { retirerServiceSelSchema } from '@/lib/validations/moderation';
import {
  type DonneesAnnulerPrestation,
  type DonneesContesterPrestation,
  type DonneesCreerServiceSel,
  type DonneesDeclarerRealisee,
  type DonneesReserverPrestation,
  annulerPrestationSchema,
  contesterPrestationSchema,
  creerServiceSelSchema,
  declarerRealiseeSchema,
  reserverPrestationSchema,
} from '@/lib/validations/sel';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions du sous-espace SEL (chantier 4.2).
 *
 * Workflow d'une prestation :
 *   1. `reserverPrestation` → ligne au statut `en_attente`.
 *   2. `declarerRealisee` (par le prestataire) → `en_moderation`,
 *      compteur 2 h démarre.
 *   3. Si rien ne se passe pendant 2 h, un cron (à poser séparément)
 *      appelle `crediterPrestationsEnAttente` qui crédite le wallet
 *      T99CP et passe au statut `creditee`.
 *   4. Si la bénéficiaire conteste avant 2 h → `contestee`, modération
 *      humaine.
 *   5. `annulerPrestation` avant `en_moderation` → `annulee`.
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Création d'un service SEL
// ============================================================
export async function creerServiceSel(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerServiceSelSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerServiceSel = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour publier un service.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUnique(donnees.titre, supabase);

  const { error } = await supabase.from('service_sel').insert({
    slug,
    titre: donnees.titre,
    description: donnees.description,
    categorie: donnees.categorie,
    sens: donnees.sens,
    duree_minutes_estimee: donnees.duree_minutes_estimee,
    lieu: donnees.lieu,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    createurice_id: session.userId,
  });

  if (error !== null) {
    return { ok: false, message: `Publication impossible : ${error.message}` };
  }

  revalidatePath('/s-entraider/sel');
  return { ok: true, slug };
}

// ============================================================
// Réservation d'une prestation
// ============================================================
export async function reserverPrestation(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ prestation_id: string }>> {
  const parse = reserverPrestationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesReserverPrestation = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué.',
    };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour réserver.' };
  }

  const supabase = await getSupabaseServer();
  const { data: service } = await supabase
    .from('service_sel')
    .select('id, sens, statut, createurice_id')
    .eq('id', donnees.service_id)
    .maybeSingle();

  if (service === null) {
    return { ok: false, message: 'Service introuvable.' };
  }
  if (service.statut !== 'publie') {
    return { ok: false, message: 'Ce service n’est plus disponible.' };
  }
  if (service.createurice_id === session.userId) {
    return { ok: false, message: 'Tu ne peux pas réserver ton propre service.' };
  }

  // Détermine prestataire/bénéficiaire selon le sens du service :
  //   - sens 'propose' (j'offre mon temps) → créateurice = prestataire,
  //     réservataire = bénéficiaire.
  //   - sens 'cherche' (j'ai besoin d'aide) → créateurice = bénéficiaire,
  //     réservataire = prestataire.
  const prestataireId = service.sens === 'propose' ? service.createurice_id : session.userId;
  const beneficiaireId = service.sens === 'propose' ? session.userId : service.createurice_id;

  const { data: prestation, error } = await supabase
    .from('prestation_sel')
    .insert({
      service_id: service.id,
      prestataire_id: prestataireId,
      beneficiaire_id: beneficiaireId,
    })
    .select('id')
    .single();

  if (error !== null || prestation === null) {
    return {
      ok: false,
      message: `Réservation impossible : ${error?.message ?? 'erreur inconnue'}`,
    };
  }

  revalidatePath(`/s-entraider/sel/${service.id}`);
  revalidatePath('/profil/contributions');
  return { ok: true, prestation_id: prestation.id };
}

// ============================================================
// Déclaration de réalisation (par le prestataire)
// ============================================================
export async function declarerRealisee(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = declarerRealiseeSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesDeclarerRealisee = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: prestation } = await supabase
    .from('prestation_sel')
    .select('id, prestataire_id, statut')
    .eq('id', donnees.prestation_id)
    .maybeSingle();

  if (prestation === null) {
    return { ok: false, message: 'Prestation introuvable.' };
  }
  if (prestation.prestataire_id !== session.userId) {
    return { ok: false, message: 'Seul·e le ou la prestataire peut déclarer la réalisation.' };
  }
  if (prestation.statut !== 'en_attente') {
    return { ok: false, message: 'Cette prestation a déjà été déclarée ou clôturée.' };
  }

  const { error } = await supabase
    .from('prestation_sel')
    .update({
      statut: 'en_moderation',
      declaree_realisee_le: new Date().toISOString(),
      duree_minutes_reelle: donnees.duree_minutes_reelle,
    })
    .eq('id', donnees.prestation_id);

  if (error !== null) {
    return { ok: false, message: `Déclaration impossible : ${error.message}` };
  }

  revalidatePath('/profil/contributions');
  return { ok: true };
}

// ============================================================
// Contestation (par le bénéficiaire)
// ============================================================
export async function contesterPrestation(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = contesterPrestationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesContesterPrestation = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: prestation } = await supabase
    .from('prestation_sel')
    .select('id, beneficiaire_id, statut')
    .eq('id', donnees.prestation_id)
    .maybeSingle();
  if (prestation === null) {
    return { ok: false, message: 'Prestation introuvable.' };
  }
  if (prestation.beneficiaire_id !== session.userId) {
    return { ok: false, message: 'Seul·e le ou la bénéficiaire peut contester.' };
  }
  if (prestation.statut !== 'en_moderation') {
    return { ok: false, message: 'Cette prestation ne peut plus être contestée.' };
  }

  const { error } = await supabase
    .from('prestation_sel')
    .update({
      statut: 'contestee',
      contestee_le: new Date().toISOString(),
    })
    .eq('id', donnees.prestation_id);

  // La `raison` n'a pas de colonne dédiée en v1 (cf. spec §6E qui ne
  // détaille pas) : on la consigne dans le `journal_admin` plutôt.
  // Pour 4.2 v1, on log juste côté console.
  console.info('[contesterPrestation] motif :', donnees.raison);

  if (error !== null) {
    return { ok: false, message: `Contestation impossible : ${error.message}` };
  }

  revalidatePath('/profil/contributions');
  return { ok: true };
}

// ============================================================
// Annulation avant exécution
// ============================================================
export async function annulerPrestation(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = annulerPrestationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAnnulerPrestation = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: prestation } = await supabase
    .from('prestation_sel')
    .select('id, prestataire_id, beneficiaire_id, statut')
    .eq('id', donnees.prestation_id)
    .maybeSingle();
  if (prestation === null) {
    return { ok: false, message: 'Prestation introuvable.' };
  }
  const partie =
    prestation.prestataire_id === session.userId || prestation.beneficiaire_id === session.userId;
  if (!partie) {
    return { ok: false, message: 'Tu dois être partie prenante pour annuler.' };
  }
  if (prestation.statut !== 'en_attente') {
    return { ok: false, message: 'Cette prestation ne peut plus être annulée.' };
  }

  const { error } = await supabase
    .from('prestation_sel')
    .update({ statut: 'annulee', annulee_le: new Date().toISOString() })
    .eq('id', donnees.prestation_id);

  if (error !== null) {
    return { ok: false, message: `Annulation impossible : ${error.message}` };
  }

  revalidatePath('/profil/contributions');
  return { ok: true };
}

// ============================================================
// Cron applicatif : crédite les prestations en attente depuis > 2 h.
//
// Pour 4.2 v1 :
//   - cette fonction est exportée comme Server Action mais sans
//     déclencheur automatique en BDD ; elle peut être appelée manuellement
//     par un·e admin ou par un cron Cloudflare Worker.
//   - utilise `MockT99CPService` en mode mock (T99CP_NETWORK=mock).
// ============================================================
export async function crediterPrestationsEnAttente(): Promise<
  ResultatAction<{ traitees: number }>
> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  // Garde-fou : seul·e un·e admin national peut déclencher manuellement
  // le crédit en masse (en attendant le cron).
  const { data: estNational } = await supabase.rpc('est_admin_national');
  if (estNational !== true) {
    return { ok: false, message: 'Seul l’admin national peut déclencher le crédit.' };
  }

  const { data: prestations, error } = await supabase.rpc('prestations_a_crediter', {
    seuil_minutes: 120,
  });

  if (error !== null || prestations === null) {
    return { ok: false, message: `Lecture impossible : ${error?.message ?? ''}` };
  }

  const t99cp = getT99CPService();
  // Adresse source : wallet trésorerie du mouvement (lu depuis env, mock OK).
  const adresseSource =
    process.env.T99CP_TRESORERIE_WALLET_ADRESSE ?? '0xtresorerie_mock_maintenant_mouvement';

  let traitees = 0;
  for (const presta of prestations) {
    if (presta.duree_minutes_reelle === null) continue;
    const { data: prestaPersonne } = await supabase
      .from('personne')
      .select('id')
      .eq('id', presta.prestataire_id)
      .maybeSingle();
    if (prestaPersonne === null) continue;

    // Adresse wallet de la prestataire : v1, on suppose une convention
    // « wallet par défaut = id personne ». Quand la table `wallet_t99cp`
    // existera (chantier T99CP), on l'utilisera proprement.
    const adresseDestination = `0xperso_${prestaPersonne.id.slice(0, 32)}`;

    const tx = await t99cp.envoyerTransaction(
      adresseSource,
      adresseDestination,
      BigInt(presta.duree_minutes_reelle),
    );

    await supabase
      .from('prestation_sel')
      .update({
        statut: 'creditee',
        creditee_le: new Date().toISOString(),
        tx_hash_credit: tx.txHash,
      })
      .eq('id', presta.id);

    traitees += 1;
  }

  return { ok: true, traitees };
}

// ============================================================
// Retrait d'un service SEL (modération a posteriori, admin)
// ============================================================
export async function retirerServiceSel(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerServiceSelSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  // Droit de modération sur l'onglet SEL (ou admin général).
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    const { data: estMod } = await supabase.rpc('est_moderateurice', { onglet_demande: 'sel' });
    if (estMod !== true) {
      return { ok: false, message: 'Droit de modération requis.' };
    }
  }

  const { data: avant } = await supabase
    .from('service_sel')
    .select('id, statut')
    .eq('id', donnees.service_id)
    .maybeSingle();
  if (avant === null) {
    return { ok: false, message: 'Service introuvable.' };
  }
  if (avant.statut === 'retire') {
    return { ok: false, message: 'Ce service est déjà retiré.' };
  }

  const { error } = await supabase
    .from('service_sel')
    .update({ statut: 'retire' })
    .eq('id', donnees.service_id);
  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  // `service_sel` n'a pas de colonne de retrait : on trace dans le journal d'audit.
  await journaliser({
    action: 'service_sel.retire',
    cibleTable: 'service_sel',
    cibleId: donnees.service_id,
    ancienEtat: { statut: avant.statut },
    nouvelEtat: { statut: 'retire', raison: donnees.raison },
  });

  revalidatePath('/s-entraider/sel');
  revalidatePath('/admin/moderation/sel');
  return { ok: true };
}

// ============================================================
// Helpers internes
// ============================================================

async function genererSlugUnique(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(titre);
  if (base === '') return `service-sel-${Date.now()}`;
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('service_sel')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

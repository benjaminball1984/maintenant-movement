'use server';

import { getSession } from '@/lib/auth/session';
import { obtenirOuCreerCaisseCagnotte, poserEntreeCaisse } from '@/lib/caisse-flux';
import { calculerFraisEuros, getPaymentService } from '@/lib/payments';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesCloturerCagnotte,
  type DonneesCreerCagnotte,
  type DonneesFaireDonEuros,
  type DonneesFaireDonT99CP,
  type DonneesRetablirCagnotte,
  type DonneesSuspendreCagnotte,
  cloturerCagnotteSchema,
  creerCagnotteSchema,
  faireDonEurosSchema,
  faireDonT99CPSchema,
  retablirCagnotteSchema,
  suspendreCagnotteSchema,
} from '@/lib/validations/cagnotte';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

/**
 * Server Actions du sous-espace Cagnottes (chantier 3.3).
 *
 * Trois familles d'actions :
 *   1. Création / suspension / rétablissement / clôture (cycle de vie).
 *   2. Dons euros (Stripe Checkout via PaymentService) et T99CP.
 *   3. Confirmation post-Checkout (route serveur appelée par /dons/retour).
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Création d'une cagnotte
// ============================================================
export async function creerCagnotte(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerCagnotteSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerCagnotte = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une cagnotte.' };
  }

  const supabase = await getSupabaseServer();

  // Cas particulier : les cotisations sont réservées aux admins nationaux.
  // La RLS le bloquera de toute façon mais on retourne un message clair.
  if (donnees.type === 'cotisation') {
    const { data: estNational } = await supabase.rpc('est_admin_national');
    if (estNational !== true) {
      return {
        ok: false,
        message:
          'Les cagnottes de type « cotisation » sont réservées à l’équipe nationale Maintenant!.',
      };
    }
  }

  const slug = await genererSlugUnique(donnees.titre, supabase);
  const wallet =
    donnees.wallet_t99cp === '' || donnees.wallet_t99cp === undefined ? null : donnees.wallet_t99cp;

  // V2.5.53 — sanitize HTML riche optionnel avant insertion.
  const texteHtmlPropre =
    donnees.texte_html !== undefined && donnees.texte_html.trim() !== ''
      ? sanitizeRichHtml(donnees.texte_html)
      : null;

  const { error } = await supabase.from('cagnotte').insert({
    slug,
    titre: donnees.titre,
    texte: donnees.texte,
    texte_html: texteHtmlPropre,
    type: donnees.type,
    image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
    objectif_euros: donnees.objectif_euros,
    createurice_id: session.userId,
    wallet_t99cp: wallet,
    // stripe_account_id reste null jusqu'à KYC ; les dons euros seront
    // bloqués tant que ce champ n'est pas rempli (cf. faireDonEuros).
  });

  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/mobiliser/cagnottes');
  revalidatePath('/');
  return { ok: true, slug };
}

// ============================================================
// Don en euros (déclenche Stripe Checkout)
// ============================================================
export async function faireDonEuros(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ urlRedirection: string }>> {
  const parse = faireDonEurosSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesFaireDonEuros = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const supabase = await getSupabaseServer();
  const session = await getSession();

  const { data: cagnotte } = await supabase
    .from('cagnotte')
    .select('id, slug, statut, stripe_account_id, type')
    .eq('id', donnees.cagnotte_id)
    .maybeSingle();

  if (cagnotte === null) {
    return { ok: false, message: 'Cagnotte introuvable.' };
  }
  if (cagnotte.statut !== 'publiee') {
    return { ok: false, message: 'Cette cagnotte n’accepte plus de dons (suspendue ou clôturée).' };
  }
  // Pour les cotisations admin, le compte connecté est celui de l'équipe
  // nationale. Pour les autres, on exige le KYC avant tout don. En mode
  // mock, on tolère un identifiant `acct_mock_*` injecté lors d'un
  // précédent appel à `creerCompteConnecte`.
  if (cagnotte.stripe_account_id === null) {
    return {
      ok: false,
      message:
        'Cette cagnotte n’est pas encore prête à recevoir des dons en euros (KYC du porteur en attente).',
    };
  }

  const fraisCentimes = calculerFraisEuros(donnees.montant_centimes);
  const montantNet = donnees.montant_centimes - fraisCentimes;

  const origine = await urlOrigine();
  const emailDon = donnees.email === '' || donnees.email === undefined ? null : donnees.email;

  // Pré-insertion d'une ligne `en_attente` qu'on retrouvera au retour
  // de Checkout pour la mettre à jour (statut → confirme ou echoue).
  // On insère avec service_role-equivalent côté Server Action (Supabase
  // côté serveur respecte la RLS, mais notre policy `don_insert` accepte
  // les insertions où personne_id = auth.uid() OU null).
  const { data: donCree, error: erreurInsert } = await supabase
    .from('don')
    .insert({
      cagnotte_id: cagnotte.id,
      personne_id: session?.userId ?? null,
      prenom: donnees.prenom === '' ? null : (donnees.prenom ?? null),
      nom: donnees.nom === '' ? null : (donnees.nom ?? null),
      email: emailDon,
      code_postal:
        donnees.code_postal === '' || donnees.code_postal === undefined
          ? null
          : donnees.code_postal,
      monnaie: 'EUR',
      montant_centimes: montantNet,
      frais_centimes: fraisCentimes,
      accepte_newsletter: donnees.accepte_newsletter,
      accepte_contact_createurice: donnees.accepte_contact_createurice,
      statut: 'en_attente',
    })
    .select('id')
    .single();

  if (erreurInsert !== null || donCree === null) {
    return {
      ok: false,
      message: `Pré-enregistrement du don impossible : ${erreurInsert?.message ?? 'erreur inconnue'}`,
    };
  }

  const checkout = await getPaymentService().demarrerCheckout({
    montantTotalCentimes: donnees.montant_centimes,
    devise: 'EUR',
    email: emailDon,
    urlSucces: `${origine}/dons/retour?session_id={CHECKOUT_SESSION_ID}&don_id=${donCree.id}`,
    urlAnnulation: `${origine}/mobiliser/cagnottes/${cagnotte.slug}?annule=1`,
    stripeAccountId: cagnotte.stripe_account_id,
    fraisPlateformeCentimes: fraisCentimes,
    metadonnees: { don_id: donCree.id, cagnotte_id: cagnotte.id },
  });

  // On stocke le session_id pour pouvoir retrouver le don depuis le
  // retour utilisateur (avant que le webhook arrive).
  await supabase
    .from('don')
    .update({ stripe_payment_intent_id: checkout.sessionId })
    .eq('id', donCree.id);

  return { ok: true, urlRedirection: checkout.urlRedirection };
}

/**
 * Confirmation appelée par la route de retour `/dons/retour` après
 * succès Stripe Checkout. Met à jour le don en `confirme`.
 *
 * En prod, c'est aussi le webhook `checkout.session.completed` qui
 * appellera cette logique (avec un endpoint API dédié, à poser au
 * chantier de branchement Stripe réel).
 */
export async function confirmerDonEuros(sessionId: string, donId: string): Promise<ResultatAction> {
  const supabase = await getSupabaseServer();

  const statut = await getPaymentService().verifierPaiement(sessionId);
  if (!statut.estConfirme) {
    return { ok: false, message: 'Paiement non confirmé.' };
  }

  // Charge le don (avant update) pour récupérer le montant et le payeur,
  // utilisés ensuite pour poser l'entrée de caisse V2.3.27.
  const { data: donAvant } = await supabase
    .from('don')
    .select('montant_centimes, cagnotte_id, personne_id, monnaie')
    .eq('id', donId)
    .maybeSingle();

  const { error } = await supabase
    .from('don')
    .update({
      statut: 'confirme',
      confirme_le: new Date().toISOString(),
      stripe_payment_intent_id: statut.paymentIntentId ?? sessionId,
    })
    .eq('id', donId)
    .eq('statut', 'en_attente');

  if (error !== null) {
    return { ok: false, message: `Confirmation impossible : ${error.message}` };
  }

  // Récupère le slug pour revalidate ciblée + libellé pour caisse.
  const { data: don } = await supabase
    .from('don')
    .select('cagnotte_id')
    .eq('id', donId)
    .maybeSingle();
  if (don !== null) {
    const { data: cagnotte } = await supabase
      .from('cagnotte')
      .select('slug, titre')
      .eq('id', don.cagnotte_id)
      .maybeSingle();
    if (cagnotte !== null) {
      revalidatePath(`/mobiliser/cagnottes/${cagnotte.slug}`);

      // V2.3.27 : poser l'entrée dans la caisse cagnotte.
      if (donAvant !== null) {
        const c = await obtenirOuCreerCaisseCagnotte(don.cagnotte_id, cagnotte.titre);
        if (c.ok) {
          await poserEntreeCaisse({
            caisseId: c.caisseId,
            sourceType: 'don',
            sourceId: donId,
            montant: donAvant.montant_centimes / 100,
            canal: 'euro',
            motif: `Don sur cagnotte « ${cagnotte.titre.slice(0, 100)} »`,
            payeurPersonneId: donAvant.personne_id ?? undefined,
            metadata: { stripe_session_id: sessionId },
          });
        }
      }
    }
  }
  revalidatePath('/mobiliser/cagnottes');
  revalidatePath('/');
  return { ok: true };
}

// ============================================================
// Don en T99CP
// ============================================================
export async function faireDonT99CP(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = faireDonT99CPSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesFaireDonT99CP = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const supabase = await getSupabaseServer();
  const session = await getSession();

  const { data: cagnotte } = await supabase
    .from('cagnotte')
    .select('id, slug, statut, wallet_t99cp')
    .eq('id', donnees.cagnotte_id)
    .maybeSingle();

  if (cagnotte === null) {
    return { ok: false, message: 'Cagnotte introuvable.' };
  }
  if (cagnotte.statut !== 'publiee') {
    return { ok: false, message: 'Cette cagnotte n’accepte plus de dons.' };
  }
  if (cagnotte.wallet_t99cp === null) {
    return {
      ok: false,
      message: 'Cette cagnotte n’accepte pas (encore) les dons T99CP (wallet du porteur manquant).',
    };
  }

  // On ne re-vérifie pas la transaction côté chain ici : la confirmation
  // de bloc est asynchrone, et la migration `don_tx_unique` interdit le
  // double-enregistrement. On peut programmer une tâche de réconciliation
  // côté admin plus tard si nécessaire.
  const montantUnites = donnees.montant_unites; // string déjà validé

  const { error } = await supabase.from('don').insert({
    cagnotte_id: cagnotte.id,
    personne_id: session?.userId ?? null,
    prenom: donnees.prenom === '' ? null : (donnees.prenom ?? null),
    nom: donnees.nom === '' ? null : (donnees.nom ?? null),
    email: donnees.email === '' ? null : (donnees.email ?? null),
    code_postal:
      donnees.code_postal === '' || donnees.code_postal === undefined ? null : donnees.code_postal,
    monnaie: 'T99CP',
    montant_centimes: Number(montantUnites), // bigint coercé int : OK tant que <= 2^53
    frais_centimes: 0,
    tx_hash: donnees.tx_hash,
    accepte_newsletter: donnees.accepte_newsletter,
    accepte_contact_createurice: donnees.accepte_contact_createurice,
    statut: 'confirme',
    confirme_le: new Date().toISOString(),
  });

  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Ce don T99CP a déjà été enregistré.' };
    }
    return { ok: false, message: `Enregistrement impossible : ${error.message}` };
  }

  // V2.3.27 : poser l'entrée dans la caisse cagnotte (canal 99-coin).
  // Le `don` T99CP a déjà été inséré ci-dessus avec `statut='confirme'`.
  // On recharge son id pour le passer comme `source_id`.
  const { data: donInsere } = await supabase
    .from('don')
    .select('id')
    .eq('cagnotte_id', cagnotte.id)
    .eq('tx_hash', donnees.tx_hash)
    .maybeSingle();
  if (donInsere !== null) {
    const c = await obtenirOuCreerCaisseCagnotte(cagnotte.id, donnees.cagnotte_id);
    if (c.ok) {
      await poserEntreeCaisse({
        caisseId: c.caisseId,
        sourceType: 'don',
        sourceId: donInsere.id,
        montant: Number(montantUnites),
        canal: '99_coin',
        motif: 'Don T99CP sur cagnotte',
        payeurPersonneId: session?.userId ?? undefined,
        payeurExterneNom:
          session === null && donnees.prenom !== undefined && donnees.prenom !== ''
            ? `${donnees.prenom} ${donnees.nom ?? ''}`.trim()
            : undefined,
        payeurExterneEmail:
          session === null && donnees.email !== undefined && donnees.email !== ''
            ? donnees.email
            : undefined,
        metadata: { tx_hash: donnees.tx_hash },
      });
    }
  }

  revalidatePath(`/mobiliser/cagnottes/${cagnotte.slug}`);
  revalidatePath('/mobiliser/cagnottes');
  return { ok: true };
}

// ============================================================
// Suspension a posteriori (modé/admin)
// ============================================================
export async function suspendreCagnotte(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = suspendreCagnotteSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesSuspendreCagnotte = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const droit = await verifierDroitModerationCagnottes(supabase);
  if (!droit) {
    return { ok: false, message: 'Droit de modération cagnottes requis.' };
  }

  const { error } = await supabase
    .from('cagnotte')
    .update({
      statut: 'suspendue',
      suspendue_par: session.userId,
      suspendue_le: new Date().toISOString(),
      raison_suspension: donnees.raison_suspension,
    })
    .eq('id', donnees.cagnotte_id);

  if (error !== null) {
    return { ok: false, message: `Suspension impossible : ${error.message}` };
  }

  revalidatePath('/admin/moderation/cagnottes');
  revalidatePath('/mobiliser/cagnottes');
  return { ok: true };
}

// ============================================================
// Rétablissement après suspension (modé/admin)
// ============================================================
export async function retablirCagnotte(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retablirCagnotteSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRetablirCagnotte = parse.data;

  const supabase = await getSupabaseServer();
  const droit = await verifierDroitModerationCagnottes(supabase);
  if (!droit) {
    return { ok: false, message: 'Droit de modération cagnottes requis.' };
  }

  const { error } = await supabase
    .from('cagnotte')
    .update({
      statut: 'publiee',
      suspendue_par: null,
      suspendue_le: null,
      raison_suspension: null,
    })
    .eq('id', donnees.cagnotte_id);

  if (error !== null) {
    return { ok: false, message: `Rétablissement impossible : ${error.message}` };
  }

  revalidatePath('/admin/moderation/cagnottes');
  revalidatePath('/mobiliser/cagnottes');
  return { ok: true };
}

// ============================================================
// Clôture définitive (porteur·euse ou admin)
// ============================================================
export async function cloturerCagnotte(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = cloturerCagnotteSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCloturerCagnotte = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  const { data: cagnotte } = await supabase
    .from('cagnotte')
    .select('createurice_id, statut')
    .eq('id', donnees.cagnotte_id)
    .maybeSingle();
  if (cagnotte === null) {
    return { ok: false, message: 'Cagnotte introuvable.' };
  }
  if (cagnotte.statut === 'cloturee') {
    return { ok: false, message: 'Cette cagnotte est déjà clôturée.' };
  }

  const estPorteur = cagnotte.createurice_id === session.userId;
  if (!estPorteur) {
    const droit = await verifierDroitModerationCagnottes(supabase);
    if (!droit) {
      return { ok: false, message: 'Droit de clôture requis.' };
    }
  }

  const { error } = await supabase
    .from('cagnotte')
    .update({ statut: 'cloturee' })
    .eq('id', donnees.cagnotte_id);

  if (error !== null) {
    return { ok: false, message: `Clôture impossible : ${error.message}` };
  }

  revalidatePath('/mobiliser/cagnottes');
  return { ok: true };
}

// ============================================================
// Helpers internes
// ============================================================

async function genererSlugUnique(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(titre);
  if (base === '') {
    return `cagnotte-${Date.now()}`;
  }
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('cagnotte')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function verifierDroitModerationCagnottes(supabase: ClientSupabase): Promise<boolean> {
  const { data: estMod } = await supabase.rpc('est_moderateurice', {
    onglet_demande: 'cagnottes',
  });
  if (estMod === true) return true;
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  return estAdmin === true;
}

async function urlOrigine(): Promise<string> {
  // Reconstruit l'origine (protocol + host) depuis les en-têtes de la
  // requête courante, ce qui marche en dev, en preview et en prod sans
  // hard-coder une URL.
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

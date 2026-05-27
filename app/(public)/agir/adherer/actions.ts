'use server';

import { getSession } from '@/lib/auth/session';
import { obtenirOuCreerCaisseGlobale, poserEntreeCaisse } from '@/lib/caisse-flux';
import { getEmailService } from '@/lib/email';
import { getPaymentService } from '@/lib/payments';
import { getSupabaseServer } from '@/lib/supabase';
import { getT99CPService } from '@/lib/t99cp';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesAdhererEuros,
  type DonneesAdhererGratuit,
  type DonneesAdhererT99CP,
  MONTANT_ADHESION_EUR_CENTIMES,
  MONTANT_ADHESION_T99CP_UNITES,
  adhererEurosSchema,
  adhererGratuitSchema,
  adhererT99CPSchema,
} from '@/lib/validations/adhesion';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

/**
 * Server Actions de l'espace Adhérer (chantier 5.1).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7A` : 3 chemins (gratuit, euros,
 * T99CP). Cf. plan §5.1 : 12 € ou 12 T99CP, relance J+365.
 *
 * Toutes les actions exigent une session : pas d'adhésion anonyme.
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

// ============================================================
// Chemin 1 — Adhésion gratuite
// ============================================================

export async function adhererGratuit(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = adhererGratuitSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAdhererGratuit = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour adhérer.' };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('adhesion').insert({
    personne_id: session.userId,
    chemin: 'gratuit',
  });
  if (error !== null) {
    return { ok: false, message: `Adhésion impossible : ${error.message}` };
  }

  revalidatePath('/profil');
  revalidatePath('/agir/adherer');
  return { ok: true };
}

// ============================================================
// Chemin 2 — Adhésion 12 € via Stripe Checkout
// ============================================================

export async function adhererEuros(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ urlRedirection: string }>> {
  const parse = adhererEurosSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAdhererEuros = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour adhérer.' };
  }

  const supabase = await getSupabaseServer();

  // Pré-création de la ligne `adhesion` au statut `active` mais sans
  // session Stripe pour l'instant. Le webhook Stripe (ou le retour
  // utilisateur en mock) la confirme avec le sessionId. En cas
  // d'abandon, la ligne reste mais expire normalement après 365 jours
  // — équivalent à une adhésion offerte. Pour 5.1 v1, on s'en tient là.
  // Une logique de rollback explicite pourrait être ajoutée en polish.
  const { data: adhesion, error: erreurInsert } = await supabase
    .from('adhesion')
    .insert({
      personne_id: session.userId,
      chemin: 'euros',
      montant_euros_centimes: MONTANT_ADHESION_EUR_CENTIMES,
    })
    .select('id')
    .single();

  if (erreurInsert !== null || adhesion === null) {
    return {
      ok: false,
      message: `Pré-enregistrement impossible : ${erreurInsert?.message ?? ''}`,
    };
  }

  const origine = await urlOrigine();
  // Stripe Connect : pour l'adhésion, le compte connecté est celui de
  // l'association centrale (env STRIPE_TRESORERIE_ACCOUNT_ID). En mock,
  // on laisse une valeur factice.
  const stripeAccountId = process.env.STRIPE_TRESORERIE_ACCOUNT_ID ?? 'acct_mock_tresorerie';

  const checkout = await getPaymentService().demarrerCheckout({
    montantTotalCentimes: MONTANT_ADHESION_EUR_CENTIMES,
    devise: 'EUR',
    email: session.email,
    urlSucces: `${origine}/agir/adherer/retour?session_id={CHECKOUT_SESSION_ID}&adhesion_id=${adhesion.id}`,
    urlAnnulation: `${origine}/agir/adherer/euros?annule=1`,
    stripeAccountId,
    fraisPlateformeCentimes: 0,
    metadonnees: { adhesion_id: adhesion.id, personne_id: session.userId },
  });

  await supabase
    .from('adhesion')
    .update({ stripe_session_id: checkout.sessionId })
    .eq('id', adhesion.id);

  return { ok: true, urlRedirection: checkout.urlRedirection };
}

// ============================================================
// Chemin 3 — Adhésion 12 T99CP
// ============================================================

export async function adhererT99CP(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = adhererT99CPSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAdhererT99CP = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour adhérer.' };
  }

  // En attendant le wallet réel (chantier T99CP), on simule la
  // transaction via le service abstrait. Cohérent avec dons 3.3 et
  // achats marché 4.3.
  const t99cp = getT99CPService();
  const adresseSource = `0xperso_${session.userId.slice(0, 32)}`;
  const adresseDestination =
    process.env.T99CP_TRESORERIE_WALLET_ADRESSE ?? '0xtresorerie_mock_maintenant_mouvement';
  const tx = await t99cp.envoyerTransaction(
    adresseSource,
    adresseDestination,
    BigInt(MONTANT_ADHESION_T99CP_UNITES),
  );

  const txHash =
    donnees.tx_hash === '' || donnees.tx_hash === undefined ? tx.txHash : donnees.tx_hash;

  const supabase = await getSupabaseServer();
  const { data: adhesionInseree, error } = await supabase
    .from('adhesion')
    .insert({
      personne_id: session.userId,
      chemin: 't99cp',
      montant_t99cp_unites: MONTANT_ADHESION_T99CP_UNITES,
      tx_hash: txHash,
    })
    .select('id')
    .single();
  if (error !== null) {
    return { ok: false, message: `Adhésion impossible : ${error.message}` };
  }

  // V2.3.27 : poser l'entrée dans la caisse globale adhésion (canal 99-coin).
  if (adhesionInseree !== null) {
    const c = await obtenirOuCreerCaisseGlobale('adhesion');
    if (c.ok) {
      await poserEntreeCaisse({
        caisseId: c.caisseId,
        sourceType: 'adhesion',
        sourceId: adhesionInseree.id,
        montant: Number(MONTANT_ADHESION_T99CP_UNITES),
        canal: '99_coin',
        motif: 'Adhésion annuelle (chemin 99-coin)',
        payeurPersonneId: session.userId,
        metadata: { tx_hash: txHash },
      });
    }
  }

  revalidatePath('/profil');
  revalidatePath('/agir/adherer');
  return { ok: true };
}

// ============================================================
// Retour Stripe Checkout (chemin euros) — appelé par /agir/adherer/retour
// ============================================================

export async function confirmerAdhesionEuros(
  sessionId: string,
  adhesionId: string,
): Promise<ResultatAction> {
  const supabase = await getSupabaseServer();
  const statut = await getPaymentService().verifierPaiement(sessionId);
  if (!statut.estConfirme) {
    return { ok: false, message: 'Paiement non confirmé.' };
  }

  // L'adhésion est déjà à `active` ; on enregistre juste la trace.
  const { error } = await supabase
    .from('adhesion')
    .update({ stripe_session_id: sessionId })
    .eq('id', adhesionId);
  if (error !== null) {
    return { ok: false, message: `Confirmation impossible : ${error.message}` };
  }

  // V2.3.27 : poser l'entrée dans la caisse globale adhésion.
  const { data: adhesion } = await supabase
    .from('adhesion')
    .select('personne_id, montant_euros_centimes')
    .eq('id', adhesionId)
    .maybeSingle();
  if (adhesion !== null) {
    const c = await obtenirOuCreerCaisseGlobale('adhesion');
    if (c.ok) {
      await poserEntreeCaisse({
        caisseId: c.caisseId,
        sourceType: 'adhesion',
        sourceId: adhesionId,
        montant: adhesion.montant_euros_centimes / 100,
        canal: 'euro',
        motif: 'Adhésion annuelle (chemin euros)',
        payeurPersonneId: adhesion.personne_id,
        metadata: { stripe_session_id: sessionId },
      });
    }
  }

  revalidatePath('/profil');
  revalidatePath('/agir/adherer');
  return { ok: true };
}

// ============================================================
// Cron applicatif — Relance J+365
// ============================================================

/**
 * Pour chaque adhésion active qui expire bientôt et n'a pas encore
 * reçu de relance, envoie un mail transactionnel via EmailService.
 * Réservé à l'admin national en attendant le cron Cloudflare Worker.
 *
 * Le seuil par défaut est de 0 jours = expirant aujourd'hui ou
 * antérieures. En prod, le cron tournera quotidiennement avec ce seuil
 * pour rattraper le jour J + le dernier jour avant.
 */
export async function envoyerRelancesAdhesion(
  seuilJours = 14,
): Promise<ResultatAction<{ envoyees: number }>> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: estNational } = await supabase.rpc('est_admin_national');
  if (estNational !== true) {
    return { ok: false, message: 'Seul l’admin national peut déclencher la relance.' };
  }

  const { data: adhesions, error } = await supabase.rpc('adhesions_a_relancer', {
    seuil_jours: seuilJours,
  });
  if (error !== null || adhesions === null) {
    return { ok: false, message: `Lecture impossible : ${error?.message ?? ''}` };
  }

  const email = getEmailService();
  let envoyees = 0;
  for (const adhesion of adhesions) {
    const { data: personne } = await supabase
      .from('personne')
      .select('email, prenom')
      .eq('id', adhesion.personne_id)
      .maybeSingle();
    if (personne === null || personne.email === null) continue;

    await email.envoyerTransactionnel({
      destinataire: personne.email,
      sujet: 'Ton adhésion à Maintenant! arrive à échéance',
      html: gabaritRelance(personne.prenom),
      texte: textRelance(personne.prenom),
    });

    await supabase
      .from('adhesion')
      .update({ relance_envoyee_le: new Date().toISOString() })
      .eq('id', adhesion.id);
    envoyees += 1;
  }

  return { ok: true, envoyees };
}

// ============================================================
// Gabarits du mail de relance (microcopy fonctionnelle, pas fond
// politique : 1 phrase factuelle + 1 lien). Ton sobre, pas
// d'argumentaire (cf. spec §7A « doctrine ouverte, pas d'argumentaire
// pesant »).
// ============================================================

function gabaritRelance(prenom: string | null): string {
  const salut = prenom !== null && prenom.trim() !== '' ? `Bonjour ${prenom},` : 'Bonjour,';
  return `<p>${salut}</p>
<p>Ton adhésion à Maintenant! arrive à échéance. Pour la renouveler, c'est par ici :</p>
<p><a href="https://maintenant-le-mouvement.org/agir/adherer">Renouveler mon adhésion</a></p>
<p>3 chemins, comme toujours : gratuit, 12 €, ou 12 99-coin. Sans pression.</p>
<p>L'équipe Maintenant!</p>`;
}

function textRelance(prenom: string | null): string {
  const salut = prenom !== null && prenom.trim() !== '' ? `Bonjour ${prenom},` : 'Bonjour,';
  return `${salut}\n\nTon adhésion à Maintenant! arrive à échéance.\n\nPour la renouveler : https://maintenant-le-mouvement.org/agir/adherer\n\n3 chemins : gratuit, 12 €, ou 12 99-coin. Sans pression.\n\nL'équipe Maintenant!`;
}

// ============================================================
// Helpers
// ============================================================

async function urlOrigine(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

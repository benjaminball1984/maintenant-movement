'use server';

import { getSession } from '@/lib/auth/session';
import { calculerFraisEuros, getPaymentService } from '@/lib/payments';
import { getSupabaseServer } from '@/lib/supabase';
import { getT99CPService } from '@/lib/t99cp';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesAcheterProduit,
  type DonneesCreerBoutique,
  type DonneesCreerMinimarche,
  type DonneesCreerProduitMarche,
  type DonneesMarquerVendu,
  type DonneesNoterVendeureuse,
  type DonneesRattacherProduitBoutique,
  type DonneesRetirerProduit,
  acheterProduitSchema,
  creerBoutiqueSchema,
  creerMinimarcheSchema,
  creerProduitMarcheSchema,
  marquerVenduSchema,
  noterVendeureuseSchema,
  rattacherProduitBoutiqueSchema,
  retirerProduitSchema,
} from '@/lib/validations/marche';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

/**
 * Server Actions du sous-espace Marché solidaire (chantier 4.3).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §6F`. 3 onglets, modération a
 * posteriori, notation 5 étoiles unilatérale, double affichage EUR/T99CP.
 *
 * Conventions reprises des autres chantiers :
 *   - `ResultatAction<T>` discriminant `ok: true | false`.
 *   - Validation Zod en première étape, Turnstile ensuite, auth après.
 *   - Slug unique via helper partagé `slugifierTitreMobilisation`.
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Onglet 1 — Produit
// ============================================================

export async function creerProduitMarche(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerProduitMarcheSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerProduitMarche = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour publier un produit.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUnique('produit_marche', donnees.titre, supabase);

  const categorie =
    donnees.categorie_slug === '' || donnees.categorie_slug === undefined
      ? null
      : donnees.categorie_slug;
  const image =
    donnees.image_url === '' || donnees.image_url === undefined ? null : donnees.image_url;

  const { error } = await supabase.from('produit_marche').insert({
    slug,
    titre: donnees.titre,
    description: donnees.description,
    mode: donnees.mode,
    prix_euros_centimes: donnees.prix_euros_centimes,
    prix_t99cp_unites: donnees.prix_t99cp_unites,
    categorie_slug: categorie,
    image_url: image,
    lieu: donnees.lieu,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    remise_main_propre: donnees.remise_main_propre,
    envoi_postal: donnees.envoi_postal,
    vendeureuse_id: session.userId,
  });

  if (error !== null) {
    return { ok: false, message: `Publication impossible : ${error.message}` };
  }

  revalidatePath('/s-entraider/marche');
  revalidatePath('/s-entraider/marche/produits');
  return { ok: true, slug };
}

export async function retirerProduit(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerProduitSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRetirerProduit = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: produit } = await supabase
    .from('produit_marche')
    .select('vendeureuse_id, statut, slug')
    .eq('id', donnees.produit_id)
    .maybeSingle();

  if (produit === null) {
    return { ok: false, message: 'Produit introuvable.' };
  }
  const droit = await aDroitModerationMarche(supabase);
  if (produit.vendeureuse_id !== session.userId && !droit) {
    return { ok: false, message: 'Tu ne peux pas retirer ce produit.' };
  }
  if (produit.statut === 'vendu' || produit.statut === 'retire') {
    return { ok: false, message: 'Ce produit ne peut plus être retiré.' };
  }

  const { error } = await supabase
    .from('produit_marche')
    .update({ statut: 'retire' })
    .eq('id', donnees.produit_id);
  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }
  // La raison est consignée dans le journal admin si modération, sinon
  // simple trace en console (cohérent avec le pattern SEL §6E).
  console.info('[retirerProduit] motif :', donnees.raison);

  revalidatePath('/s-entraider/marche');
  revalidatePath(`/s-entraider/marche/produits/${produit.slug}`);
  return { ok: true };
}

/**
 * Marque un produit comme vendu, en consignant l'acheteureuse choisie
 * par la vendeureuse (clé de la notation unilatérale, cf. spec §6F).
 *
 * Garde-fous :
 *   - seul·e la vendeureuse peut marquer son produit vendu ;
 *   - l'acheteureuse doit être une autre personne ;
 *   - le produit doit être encore `disponible` ou `reserve`.
 */
export async function marquerProduitVendu(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = marquerVenduSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesMarquerVendu = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  if (donnees.acheteureuse_id === session.userId) {
    return { ok: false, message: 'L’acheteureuse doit être une autre personne.' };
  }

  const supabase = await getSupabaseServer();
  const { data: produit } = await supabase
    .from('produit_marche')
    .select('vendeureuse_id, statut, slug')
    .eq('id', donnees.produit_id)
    .maybeSingle();

  if (produit === null) {
    return { ok: false, message: 'Produit introuvable.' };
  }
  if (produit.vendeureuse_id !== session.userId) {
    return { ok: false, message: 'Seul·e la vendeureuse peut marquer son produit vendu.' };
  }
  if (produit.statut !== 'disponible' && produit.statut !== 'reserve') {
    return {
      ok: false,
      message: 'Ce produit n’est plus dans un état où il peut être marqué vendu.',
    };
  }

  const { error } = await supabase
    .from('produit_marche')
    .update({
      statut: 'vendu',
      derniere_activite_le: new Date().toISOString(),
    })
    .eq('id', donnees.produit_id);
  if (error !== null) {
    return { ok: false, message: `Mise à jour impossible : ${error.message}` };
  }

  // L'acheteureuse est consignée applicativement via la notation future.
  // Pour 4.3 v1, on log l'évènement (sera un audit côté chantier 9.2).
  console.info('[marquerProduitVendu]', donnees.produit_id, 'vendu à', donnees.acheteureuse_id);

  revalidatePath(`/s-entraider/marche/produits/${produit.slug}`);
  revalidatePath('/s-entraider/marche/produits');
  return { ok: true };
}

// ============================================================
// Notation 5 étoiles unilatérale
// ============================================================

/**
 * Crée une notation sur un produit vendu. La RLS empêche déjà :
 *   - les notations sur un produit non vendu ;
 *   - les auto-notations (acheteureuse = vendeureuse) ;
 *   - les notations en double (UNIQUE produit × acheteureuse).
 *
 * Côté Server Action, on retourne des messages clairs si la BDD refuse.
 */
export async function noterVendeureuse(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = noterVendeureuseSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesNoterVendeureuse = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: produit } = await supabase
    .from('produit_marche')
    .select('id, vendeureuse_id, statut, slug')
    .eq('id', donnees.produit_id)
    .maybeSingle();
  if (produit === null) {
    return { ok: false, message: 'Produit introuvable.' };
  }
  if (produit.statut !== 'vendu') {
    return { ok: false, message: 'On ne peut noter qu’un produit vendu.' };
  }
  if (produit.vendeureuse_id === session.userId) {
    return { ok: false, message: 'Tu ne peux pas te noter toi-même.' };
  }

  const commentaire =
    donnees.commentaire === '' || donnees.commentaire === undefined ? null : donnees.commentaire;

  const { error } = await supabase.from('notation_marche').insert({
    produit_id: produit.id,
    acheteureuse_id: session.userId,
    vendeureuse_id: produit.vendeureuse_id,
    etoiles: donnees.etoiles,
    commentaire,
  });

  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Tu as déjà noté ce produit.' };
    }
    return { ok: false, message: `Notation impossible : ${error.message}` };
  }

  revalidatePath(`/s-entraider/marche/produits/${produit.slug}`);
  return { ok: true };
}

// ============================================================
// Achat en ligne (mock Stripe pour EUR + T99CP pour T99CP)
// ============================================================

/**
 * Initie un achat en ligne. Comportement par monnaie :
 *
 *   - EUR : on calcule les frais (5 %), on crée une session Stripe
 *     Checkout (mock par défaut), on retourne l'URL de redirection. Le
 *     produit passe en `reserve` ; la confirmation est faite par la
 *     route `/dons/retour` ou un webhook (chantier polish).
 *   - T99CP : on attend un `tx_hash` côté front (signature wallet).
 *     Frais 0 %. Le produit passe directement en `vendu` (on suppose
 *     la transaction acceptée ; réconciliation côté admin si besoin).
 *
 * v1 : pas de table `commande` dédiée (les `notation_marche` + le
 * statut du produit suffisent pour la suite). Sera ajoutée si le
 * besoin se concrétise (multi-articles, panier).
 */
export async function acheterProduit(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ urlRedirection?: string }>> {
  const parse = acheterProduitSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAcheterProduit = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour acheter.' };
  }

  const supabase = await getSupabaseServer();
  const { data: produit } = await supabase
    .from('produit_marche')
    .select('id, slug, titre, mode, statut, prix_euros_centimes, prix_t99cp_unites, vendeureuse_id')
    .eq('id', donnees.produit_id)
    .maybeSingle();

  if (produit === null) {
    return { ok: false, message: 'Produit introuvable.' };
  }
  if (produit.statut !== 'disponible') {
    return { ok: false, message: 'Ce produit n’est plus disponible.' };
  }
  if (produit.vendeureuse_id === session.userId) {
    return { ok: false, message: 'Tu ne peux pas acheter ton propre produit.' };
  }
  if (produit.mode === 'don') {
    return {
      ok: false,
      message: 'Ce produit est offert : contacte la personne directement, sans paiement.',
    };
  }

  if (donnees.monnaie === 'EUR') {
    if (produit.prix_euros_centimes <= 0) {
      return { ok: false, message: 'Ce produit n’a pas de prix en euros.' };
    }

    // Stripe Connect : pour 4.3 v1, on ne dispose pas du compte
    // connecté du marché (cohérent avec cagnottes où chaque porteur
    // a son compte). On simule un `acct_mock_marche_*` pour le mock.
    const stripeAccountId =
      process.env.STRIPE_MARCHE_ACCOUNT_ID ??
      `acct_mock_marche_${produit.vendeureuse_id.slice(0, 8)}`;
    const fraisCentimes = calculerFraisEuros(produit.prix_euros_centimes);
    const origine = await urlOrigine();

    // Réserve immédiatement pour bloquer les double-achats.
    await supabase
      .from('produit_marche')
      .update({
        statut: 'reserve',
        derniere_activite_le: new Date().toISOString(),
      })
      .eq('id', produit.id)
      .eq('statut', 'disponible');

    const checkout = await getPaymentService().demarrerCheckout({
      montantTotalCentimes: produit.prix_euros_centimes,
      devise: 'EUR',
      email: null,
      urlSucces: `${origine}/s-entraider/marche/produits/${produit.slug}?achat=succes`,
      urlAnnulation: `${origine}/s-entraider/marche/produits/${produit.slug}?achat=annule`,
      stripeAccountId,
      fraisPlateformeCentimes: fraisCentimes,
      metadonnees: { produit_id: produit.id, acheteureuse_id: session.userId },
    });

    return { ok: true, urlRedirection: checkout.urlRedirection };
  }

  // monnaie === 'T99CP'
  if (produit.prix_t99cp_unites === '0') {
    return { ok: false, message: 'Ce produit n’a pas de prix en T99CP.' };
  }

  // En v1, le tx_hash est admis comme preuve (cohérent avec dons T99CP
  // §5D). Une réconciliation Polygon viendra avec le wallet réel.
  const t99cp = getT99CPService();
  const adresseSource = `0xperso_${session.userId.slice(0, 32)}`;
  const adresseDestination = `0xperso_${produit.vendeureuse_id.slice(0, 32)}`;
  await t99cp.envoyerTransaction(
    adresseSource,
    adresseDestination,
    BigInt(produit.prix_t99cp_unites),
  );

  const { error: errUpdate } = await supabase
    .from('produit_marche')
    .update({
      statut: 'vendu',
      derniere_activite_le: new Date().toISOString(),
    })
    .eq('id', produit.id);
  if (errUpdate !== null) {
    return { ok: false, message: `Mise à jour impossible : ${errUpdate.message}` };
  }
  console.info('[acheterProduit T99CP] tx_hash :', donnees.tx_hash);

  revalidatePath(`/s-entraider/marche/produits/${produit.slug}`);
  return { ok: true };
}

// ============================================================
// Onglet 2 — Boutique éphémère
// ============================================================

export async function creerBoutique(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerBoutiqueSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerBoutique = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une boutique.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUnique('boutique_marche', donnees.nom, supabase, 'nom');

  const ouverte_du =
    donnees.ouverte_du === '' || donnees.ouverte_du === undefined ? null : donnees.ouverte_du;
  const ouverte_au =
    donnees.ouverte_au === '' || donnees.ouverte_au === undefined ? null : donnees.ouverte_au;
  const lieu = donnees.lieu === '' || donnees.lieu === undefined ? null : donnees.lieu;
  const image =
    donnees.image_url === '' || donnees.image_url === undefined ? null : donnees.image_url;

  const { error } = await supabase.from('boutique_marche').insert({
    slug,
    nom: donnees.nom,
    description: donnees.description,
    sens: donnees.sens,
    image_url: image,
    ouverte_du,
    ouverte_au,
    lieu,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    createurice_id: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Publication impossible : ${error.message}` };
  }

  revalidatePath('/s-entraider/marche');
  revalidatePath('/s-entraider/marche/boutiques');
  return { ok: true, slug };
}

export async function rattacherProduitBoutique(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = rattacherProduitBoutiqueSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRattacherProduitBoutique = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('produit_boutique').insert({
    produit_id: donnees.produit_id,
    boutique_id: donnees.boutique_id,
    rattache_par: session.userId,
  });
  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Ce produit est déjà rattaché à cette boutique.' };
    }
    return { ok: false, message: `Rattachement impossible : ${error.message}` };
  }

  revalidatePath('/s-entraider/marche/boutiques');
  return { ok: true };
}

// ============================================================
// Onglet 3 — Minimarché solidaire
// ============================================================

export async function creerMinimarche(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerMinimarcheSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerMinimarche = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour annoncer un minimarché.' };
  }

  // Dédup des monnaies (le formulaire peut envoyer des doublons selon
  // les manips de cases). On préserve l'ordre d'apparition.
  const monnaies = Array.from(new Set(donnees.monnaies_acceptees));

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUnique('minimarche_solidaire', donnees.titre, supabase);
  const image =
    donnees.image_url === '' || donnees.image_url === undefined ? null : donnees.image_url;

  const { error } = await supabase.from('minimarche_solidaire').insert({
    slug,
    titre: donnees.titre,
    description: donnees.description,
    image_url: image,
    lieu: donnees.lieu,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    commence_le: donnees.commence_le,
    termine_le: donnees.termine_le,
    monnaies_acceptees: monnaies,
    createurice_id: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Publication impossible : ${error.message}` };
  }

  revalidatePath('/s-entraider/marche');
  revalidatePath('/s-entraider/marche/minimarches');
  return { ok: true, slug };
}

// ============================================================
// Helpers internes
// ============================================================

/**
 * Génère un slug unique pour une table donnée. La colonne par défaut
 * pour la base du slug est `titre`, mais on accepte une autre source
 * (cas des boutiques où c'est `nom`).
 */
async function genererSlugUnique(
  table: 'produit_marche' | 'boutique_marche' | 'minimarche_solidaire',
  source: string,
  supabase: ClientSupabase,
  _colSlug: 'titre' | 'nom' = 'titre',
): Promise<string> {
  const base = slugifierTitreMobilisation(source);
  if (base === '') return `${table}-${Date.now()}`;
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function aDroitModerationMarche(supabase: ClientSupabase): Promise<boolean> {
  const { data: estMod } = await supabase.rpc('est_moderateurice', {
    onglet_demande: 'marche',
  });
  if (estMod === true) return true;
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  return estAdmin === true;
}

async function urlOrigine(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

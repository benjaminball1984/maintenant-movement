'use server';

import { randomUUID } from 'node:crypto';
import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesCreerCommuneLibre,
  type DonneesCreerConfederation,
  type DonneesCreerFederation,
  type DonneesQuitterCommune,
  type DonneesRattacherConfederation,
  type DonneesRattacherFederation,
  type DonneesRejoindreCommune,
  type DonneesTirerAuSortAssemblee,
  creerCommuneLibreSchema,
  creerConfederationSchema,
  creerFederationSchema,
  quitterCommuneSchema,
  rattacherConfederationSchema,
  rattacherFederationSchema,
  rejoindreCommuneSchema,
  tirerAuSortAssembleeSchema,
} from '@/lib/validations/communes';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions de l'espace Communes libres + Fédérations +
 * Confédérations (chantier 5.2).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7B`.
 *
 * Permissions d'appartenance (un clic / 2-modale / 3-modale / 4-refus) :
 * la Server Action consulte `nombre_communes_actives` et impose un
 * `confirme: true` aux paliers 2 et 3. La 4e tentative est refusée.
 * Le trigger BDD `appartenance_commune_max_actives` est notre dernier
 * filet de sécurité, mais on évite l'aller-retour BDD en filtrant ici.
 *
 * Anti-spam : 1 transition par mois glissant. Enforcé en BDD par
 * `appartenance_commune_anti_spam`. La Server Action surfaces une
 * erreur lisible si le trigger refuse.
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

/**
 * Palier de modale à afficher avant de rejoindre une commune.
 *
 *   - `direct`   : 0 commune actuelle, on rejoint sans modale.
 *   - `deuxieme` : 1 commune actuelle, modale « Es-tu sûr·e ? ».
 *   - `troisieme`: 2 communes actuelles, modale « Tu participes déjà à 2... ».
 *   - `refus`    : 3 communes actuelles ou plus, refus.
 */
export type PalierRejoindre = 'direct' | 'deuxieme' | 'troisieme' | 'refus';

/**
 * Retourne le palier de modale pour la session courante. Utilisé par
 * la fiche commune avant de déclencher l'action de rejoindre.
 */
export async function palierRejoindreCommune(): Promise<
  ResultatAction<{ palier: PalierRejoindre; nombre: number }>
> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.rpc('nombre_communes_actives', {
    personne_a_compter: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Comptage impossible : ${error.message}` };
  }
  const nombre = data ?? 0;
  const palier: PalierRejoindre =
    nombre === 0 ? 'direct' : nombre === 1 ? 'deuxieme' : nombre === 2 ? 'troisieme' : 'refus';
  return { ok: true, palier, nombre };
}

// ============================================================
// Rejoindre une commune (avec garde-fous de palier)
// ============================================================

export async function rejoindreCommune(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = rejoindreCommuneSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRejoindreCommune = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour rejoindre une commune.' };
  }

  const supabase = await getSupabaseServer();

  // Palier de la personne actuellement.
  const { data: nombre } = await supabase.rpc('nombre_communes_actives', {
    personne_a_compter: session.userId,
  });
  const palier: PalierRejoindre =
    nombre === 0 ? 'direct' : nombre === 1 ? 'deuxieme' : nombre === 2 ? 'troisieme' : 'refus';

  if (palier === 'refus') {
    return {
      ok: false,
      message:
        'Tu participes déjà à 3 communes. La spec §7B fixe ce maximum. Quitte une commune avant d’en rejoindre une nouvelle.',
    };
  }

  if ((palier === 'deuxieme' || palier === 'troisieme') && donnees.confirme !== true) {
    return {
      ok: false,
      message: 'Confirmation requise pour rejoindre une commune supplémentaire.',
    };
  }

  const { error } = await supabase.from('appartenance_commune').insert({
    personne_id: session.userId,
    commune_id: donnees.commune_id,
  });
  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Tu fais déjà partie de cette commune.' };
    }
    // Anti-spam ou max-3 actives → message clair.
    return {
      ok: false,
      message: error.message.includes('transition')
        ? "Anti-spam : une seule transition d'appartenance par mois est autorisée."
        : `Adhésion impossible : ${error.message}`,
    };
  }

  revalidatePath('/agir/communes');
  revalidatePath('/profil/communes');
  return { ok: true };
}

export async function quitterCommune(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = quitterCommuneSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesQuitterCommune = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('appartenance_commune')
    .update({ est_active: false, quittee_le: new Date().toISOString() })
    .eq('personne_id', session.userId)
    .eq('commune_id', donnees.commune_id)
    .eq('est_active', true);
  if (error !== null) {
    return { ok: false, message: `Sortie impossible : ${error.message}` };
  }

  revalidatePath('/agir/communes');
  revalidatePath('/profil/communes');
  return { ok: true };
}

// ============================================================
// Création libre d'une commune (cf. spec §7B Territoires libres)
// ============================================================

export async function creerCommuneLibre(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerCommuneLibreSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerCommuneLibre = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une commune libre.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUniqueCommune(donnees.nom, supabase);

  const { error } = await supabase.from('commune').insert({
    slug,
    nom: donnees.nom,
    description_courte:
      donnees.description_courte === '' || donnees.description_courte === undefined
        ? null
        : donnees.description_courte,
    code_postal_principal:
      donnees.code_postal_principal === '' || donnees.code_postal_principal === undefined
        ? null
        : donnees.code_postal_principal,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    statut_creation: 'auto_creee',
    createurice_id: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/agir/communes');
  return { ok: true, slug };
}

// ============================================================
// Création d'une fédération (cf. spec §7B fédération libre)
// ============================================================

export async function creerFederation(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerFederationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerFederation = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une fédération.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUniqueGenerique('federation', donnees.nom, supabase);

  const { error } = await supabase.from('federation').insert({
    slug,
    nom: donnees.nom,
    type: donnees.type,
    description_courte:
      donnees.description_courte === '' || donnees.description_courte === undefined
        ? null
        : donnees.description_courte,
    createurice_id: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/agir/communes');
  revalidatePath('/agir/federations');
  return { ok: true, slug };
}

// ============================================================
// Création d'une confédération
// ============================================================

export async function creerConfederation(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerConfederationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerConfederation = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une confédération.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUniqueGenerique('confederation', donnees.nom, supabase);

  const { error } = await supabase.from('confederation').insert({
    slug,
    nom: donnees.nom,
    description_courte:
      donnees.description_courte === '' || donnees.description_courte === undefined
        ? null
        : donnees.description_courte,
    createurice_id: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/agir/confederations');
  return { ok: true, slug };
}

// ============================================================
// Rattachement (subsidiarité par accord mutuel)
// ============================================================

export async function rattacherCommuneFederation(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = rattacherFederationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRattacherFederation = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  const { error } = await supabase.from('appartenance_federation').insert({
    commune_id: donnees.commune_id,
    federation_id: donnees.federation_id,
  });
  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Ce rattachement existe déjà.' };
    }
    return { ok: false, message: `Rattachement impossible : ${error.message}` };
  }

  revalidatePath('/agir/communes');
  revalidatePath('/agir/federations');
  return { ok: true };
}

export async function rattacherFederationConfederation(
  donneesBrutes: unknown,
): Promise<ResultatAction> {
  const parse = rattacherConfederationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRattacherConfederation = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  const { error } = await supabase.from('appartenance_confederation').insert({
    federation_id: donnees.federation_id,
    confederation_id: donnees.confederation_id,
  });
  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Ce rattachement existe déjà.' };
    }
    return { ok: false, message: `Rattachement impossible : ${error.message}` };
  }

  revalidatePath('/agir/federations');
  revalidatePath('/agir/confederations');
  return { ok: true };
}

// ============================================================
// Tirage au sort Assemblée Confédérale (admin national)
// ============================================================

export async function tirerAuSortAssemblee(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ tires: string[] }>> {
  const parse = tirerAuSortAssembleeSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesTirerAuSortAssemblee = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const { data: estNational } = await supabase.rpc('est_admin_national');
  if (estNational !== true) {
    return { ok: false, message: 'Seul l’admin national peut tirer au sort.' };
  }

  const { data: candidats, error } = await supabase.rpc('candidates_pour_assemblee', {
    entite_type_recherche: donnees.entite_type,
    entite_id_recherche: donnees.entite_id,
  });
  if (error !== null || candidats === null) {
    return { ok: false, message: `Tirage impossible : ${error?.message ?? ''}` };
  }
  // Un binôme = 2 délégué·es par entité. nb_binomes * 2 tirages.
  const aTirer = donnees.nb_binomes * 2;
  if (candidats.length < aTirer) {
    return {
      ok: false,
      message: `Pas assez de candidat·es éligibles (${candidats.length}, requis ${aTirer}).`,
    };
  }

  // Tirage Fisher-Yates avec seed pour traçabilité.
  const seed = randomUUID();
  const melange = melangerAvecSeed([...candidats], seed);
  const tires = melange.slice(0, aTirer);

  for (const personneId of tires) {
    await supabase.from('mandat_confederal').insert({
      personne_id: personneId,
      entite_type: donnees.entite_type,
      entite_id: donnees.entite_id,
      tirage_seed: seed,
    });
  }

  revalidatePath('/agir/assemblee');
  return { ok: true, tires };
}

// ============================================================
// Helpers internes
// ============================================================

async function genererSlugUniqueCommune(nom: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(nom);
  if (base === '') return `commune-libre-${Date.now()}`;
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('commune')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function genererSlugUniqueGenerique(
  table: 'federation' | 'confederation',
  nom: string,
  supabase: ClientSupabase,
): Promise<string> {
  const base = slugifierTitreMobilisation(nom);
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

/**
 * Mélange un tableau de chaînes avec un seed reproductible.
 * Implémentation : Fisher-Yates + générateur pseudo-aléatoire basé
 * sur le seed (xorshift simple). Pour 5.2 v1, ça suffit ; un audit
 * cryptographique pourra réclamer un vrai CSPRNG par la suite.
 */
function melangerAvecSeed<T>(tableau: T[], seed: string): T[] {
  let etat = 0;
  for (const c of seed) {
    etat = (etat * 31 + c.charCodeAt(0)) | 0;
  }
  if (etat === 0) etat = 1;

  const random = () => {
    etat ^= etat << 13;
    etat ^= etat >>> 17;
    etat ^= etat << 5;
    return ((etat >>> 0) % 1_000_000) / 1_000_000;
  };

  for (let i = tableau.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [tableau[i], tableau[j]] = [tableau[j] as T, tableau[i] as T];
  }
  return tableau;
}

/**
 * Helpers pour les tables `caisse`, `receptacle_caisse`, `transaction_sortante`
 * (cycle V2 D7/D12, chantier V2.2.3).
 *
 * Composant transversal trésorerie. Les Server Actions de
 * trésorerie (à écrire dans des chantiers V2 ultérieurs) appellent ces
 * helpers après vérification des droits.
 *
 * Garde-fou D12bis : aucune `transaction_sortante` n'est créée sans
 * `justificatif_storage_path` non vide. La contrainte SQL CHECK le
 * garantit côté BDD ; les helpers TS le rappellent à l'appelant.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { Json } from '@/types/database';

export type TypeCaisse = 'adhesion' | 'cotisation_solidaire' | 'don_general' | 'cagnotte' | 'autre';

export type TypeObjetCaisse = 'cagnotte' | 'adhesion' | 'campagne';

export type StatutCaisse = 'ouverte' | 'suspendue' | 'fermee';

export type CanalCaisse = 'euro' | '99_coin';

export type StatutTransactionSortante = 'initiee' | 'confirmee' | 'annulee' | 'litige';

export type MimeJustificatif = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';

export interface Caisse {
  id: string;
  typeCaisse: TypeCaisse;
  libelle: string;
  objetType: TypeObjetCaisse | null;
  objetId: string | null;
  statut: StatutCaisse;
  metadata: Json;
  ouverteLe: string;
  fermeeLe: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreerCaisseOptions {
  typeCaisse: TypeCaisse;
  libelle: string;
  objetType?: TypeObjetCaisse | null;
  objetId?: string | null;
  metadata?: Json;
}

export type ResultatCaisse = { ok: true; caisse: Caisse } | { ok: false; message: string };

/**
 * Ouvre une nouvelle caisse. Pour les caisses de cagnotte, on doit fournir
 * `objetType='cagnotte'` + `objetId`. L'index unique partiel SQL refuse
 * une seconde caisse cagnotte ouverte pour la même cagnotte.
 */
export async function creerCaisse(options: CreerCaisseOptions): Promise<ResultatCaisse> {
  if (options.typeCaisse === 'cagnotte') {
    if (options.objetType !== 'cagnotte' || !options.objetId) {
      return {
        ok: false,
        message: 'Une caisse de cagnotte exige objetType=cagnotte et objetId.',
      };
    }
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('caisse')
    .insert({
      type_caisse: options.typeCaisse,
      libelle: options.libelle,
      objet_type: options.objetType ?? null,
      objet_id: options.objetId ?? null,
      metadata: options.metadata ?? {},
    })
    .select('*')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Création impossible.' };
  }
  return { ok: true, caisse: ligneEnCaisse(data) };
}

export interface PoserReceptacleOptions {
  caisseId: string;
  canal: CanalCaisse;
  identifiantReceptacle: string;
  metadata?: Json;
}

/**
 * Pose un nouveau réceptacle (compte Stripe, wallet Polygon) pour une
 * caisse + canal. Si un réceptacle courant existait déjà, le caller
 * doit d'abord appeler `fermerReceptacleCourant` (sinon l'index unique
 * partiel SQL refusera l'insertion).
 */
export async function poserReceptacle(
  options: PoserReceptacleOptions,
): Promise<{ ok: true; receptacleId: string } | { ok: false; message: string }> {
  if (options.identifiantReceptacle.trim().length === 0) {
    return { ok: false, message: 'L’identifiant du réceptacle ne peut pas être vide.' };
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('receptacle_caisse')
    .insert({
      caisse_id: options.caisseId,
      canal: options.canal,
      identifiant_receptacle: options.identifiantReceptacle.trim(),
      metadata: options.metadata ?? {},
    })
    .select('id')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Insertion impossible.' };
  }
  return { ok: true, receptacleId: data.id };
}

/**
 * Ferme le réceptacle courant d'une caisse + canal (renseigne `valide_au`).
 * Utile avant d'en poser un nouveau (bascule Stripe général → Stripe asso).
 */
export async function fermerReceptacleCourant(
  caisseId: string,
  canal: CanalCaisse,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('receptacle_caisse')
    .update({ valide_au: new Date().toISOString() })
    .eq('caisse_id', caisseId)
    .eq('canal', canal)
    .is('valide_au', null);
  return { ok: error === null };
}

export interface InitierTransactionSortanteOptions {
  caisseId: string;
  receptacleId: string;
  /** Bénéficiaire interne, identifié par son compte. */
  beneficiairePersonneId?: string | null;
  /** Bénéficiaire externe. Fournir au moins un nom si pas de personne_id. */
  beneficiaireExterneNom?: string | null;
  beneficiaireExterneIbanOuWallet?: string | null;
  montant: number;
  canal: CanalCaisse;
  motif: string;
  /** Chemin Supabase Storage du justificatif. OBLIGATOIRE (D12bis). */
  justificatifStoragePath: string;
  justificatifNomOriginal: string;
  justificatifMimeType: MimeJustificatif;
  /** Personne qui initie le reversement (trésorier·ière). */
  initieParPersonneId: string;
}

export type ResultatTransactionSortante =
  | { ok: true; transactionId: string }
  | { ok: false; message: string };

/**
 * Initie une transaction sortante. Le justificatif est obligatoire (D12bis) ;
 * le caller doit avoir préalablement uploadé le fichier via l'adapter
 * Storage (`lib/storage/`) et fourni le chemin renvoyé.
 *
 * Statut initial : `initiee`. Passe à `confirmee` après vérification
 * humaine (Server Action `confirmerTransactionSortante`, à écrire dans un
 * chantier V2 ultérieur).
 */
export async function initierTransactionSortante(
  options: InitierTransactionSortanteOptions,
): Promise<ResultatTransactionSortante> {
  // Validations applicatives (la BDD a aussi ses CHECK).
  if (options.justificatifStoragePath.trim().length === 0) {
    return { ok: false, message: 'Justificatif obligatoire (D12bis). Chemin vide.' };
  }
  if (options.montant <= 0) {
    return { ok: false, message: 'Le montant doit être strictement positif.' };
  }
  if (options.motif.trim().length < 5) {
    return { ok: false, message: 'Le motif doit faire au moins 5 caractères.' };
  }
  if (
    (options.beneficiairePersonneId === null || options.beneficiairePersonneId === undefined) &&
    (options.beneficiaireExterneNom === null ||
      options.beneficiaireExterneNom === undefined ||
      options.beneficiaireExterneNom.trim().length === 0)
  ) {
    return {
      ok: false,
      message: 'Un bénéficiaire (interne ou externe) est obligatoire.',
    };
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('transaction_sortante')
    .insert({
      caisse_id: options.caisseId,
      receptacle_id: options.receptacleId,
      beneficiaire_personne_id: options.beneficiairePersonneId ?? null,
      beneficiaire_externe_nom: options.beneficiaireExterneNom ?? null,
      beneficiaire_externe_iban_ou_wallet: options.beneficiaireExterneIbanOuWallet ?? null,
      montant: options.montant,
      canal: options.canal,
      motif: options.motif.trim(),
      justificatif_storage_path: options.justificatifStoragePath.trim(),
      justificatif_nom_original: options.justificatifNomOriginal,
      justificatif_mime_type: options.justificatifMimeType,
      initie_par_personne_id: options.initieParPersonneId,
    })
    .select('id')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Insertion impossible.' };
  }
  return { ok: true, transactionId: data.id };
}

function ligneEnCaisse(ligne: {
  id: string;
  type_caisse: string;
  libelle: string;
  objet_type: string | null;
  objet_id: string | null;
  statut: string;
  metadata: Json;
  ouverte_le: string;
  fermee_le: string | null;
  created_at: string;
  updated_at: string;
}): Caisse {
  return {
    id: ligne.id,
    typeCaisse: ligne.type_caisse as TypeCaisse,
    libelle: ligne.libelle,
    objetType: (ligne.objet_type as TypeObjetCaisse | null) ?? null,
    objetId: ligne.objet_id ?? null,
    statut: ligne.statut as StatutCaisse,
    metadata: ligne.metadata,
    ouverteLe: ligne.ouverte_le,
    fermeeLe: ligne.fermee_le,
    createdAt: ligne.created_at,
    updatedAt: ligne.updated_at,
  };
}

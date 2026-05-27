/**
 * Helpers de lecture pour le dashboard trésorerie (cycle V2 V2.3.10).
 *
 * Lectures uniquement (pas d'écriture). Les actions (créer une caisse,
 * poser un réceptacle, initier un reversement) sont déjà disponibles dans
 * `lib/caisse.ts` (V2.2.3) ; cette couche se contente d'agréger pour la
 * vue admin nationale.
 */

import type { Caisse, CanalCaisse, StatutTransactionSortante } from '@/lib/caisse';
import { getSupabaseServer } from '@/lib/supabase';

export interface CaisseEnrichie {
  caisse: Caisse;
  nbReceptaclesActifs: number;
  nbTransactionsSortantes: number;
  derniereTransactionLe: string | null;
}

const CAISSE_CHAMPS =
  'id, type_caisse, libelle, objet_type, objet_id, statut, metadata, ouverte_le, fermee_le, created_at, updated_at';

/**
 * Liste les caisses avec quelques compteurs pour le dashboard.
 *
 * Implémentation : on lit toutes les caisses, puis on fait 2 requêtes
 * agrégées pour les compteurs (nb réceptacles actifs, nb transactions
 * sortantes par caisse + date max). Acceptable tant que le nombre de
 * caisses reste petit (typique : quelques dizaines).
 */
export async function listerCaissesPourDashboard(): Promise<CaisseEnrichie[]> {
  const supabase = await getSupabaseServer();
  const { data: caisses, error } = await supabase
    .from('caisse')
    .select(CAISSE_CHAMPS)
    .order('ouverte_le', { ascending: false });

  if (error !== null || caisses === null) return [];

  const ids = caisses.map((c) => c.id);
  if (ids.length === 0) return [];

  const { data: receptacles } = await supabase
    .from('receptacle_caisse')
    .select('caisse_id')
    .in('caisse_id', ids)
    .is('valide_au', null);

  const nbReceptaclesParCaisse = new Map<string, number>();
  for (const r of receptacles ?? []) {
    nbReceptaclesParCaisse.set(r.caisse_id, (nbReceptaclesParCaisse.get(r.caisse_id) ?? 0) + 1);
  }

  const { data: transactions } = await supabase
    .from('transaction_sortante')
    .select('caisse_id, initie_le')
    .in('caisse_id', ids)
    .order('initie_le', { ascending: false });

  const nbTransactionsParCaisse = new Map<string, number>();
  const derniereTransactionParCaisse = new Map<string, string>();
  for (const t of transactions ?? []) {
    nbTransactionsParCaisse.set(t.caisse_id, (nbTransactionsParCaisse.get(t.caisse_id) ?? 0) + 1);
    if (!derniereTransactionParCaisse.has(t.caisse_id)) {
      derniereTransactionParCaisse.set(t.caisse_id, t.initie_le);
    }
  }

  return caisses.map((c) => ({
    caisse: ligneEnCaisse(c),
    nbReceptaclesActifs: nbReceptaclesParCaisse.get(c.id) ?? 0,
    nbTransactionsSortantes: nbTransactionsParCaisse.get(c.id) ?? 0,
    derniereTransactionLe: derniereTransactionParCaisse.get(c.id) ?? null,
  }));
}

// ============================================================
// Détail d'une caisse (cycle V2 V2.3.18)
// ============================================================

export interface Receptacle {
  id: string;
  caisseId: string;
  canal: CanalCaisse;
  identifiantReceptacle: string;
  metadata: unknown;
  valideDu: string;
  valideAu: string | null;
  createdAt: string;
}

export interface TransactionSortante {
  id: string;
  caisseId: string;
  receptacleId: string;
  beneficiairePersonneId: string | null;
  beneficiaireExterneNom: string | null;
  beneficiaireExterneIbanOuWallet: string | null;
  montant: number;
  canal: CanalCaisse;
  statut: StatutTransactionSortante;
  motif: string;
  justificatifStoragePath: string;
  justificatifNomOriginal: string;
  justificatifMimeType: string;
  initiePersonneId: string;
  initieLe: string;
  confirmeLe: string | null;
}

export interface TransactionEntrante {
  id: string;
  caisseId: string;
  receptacleId: string | null;
  sourceType:
    | 'don'
    | 'adhesion'
    | 'cagnotte'
    | 'cotisation_solidaire'
    | 'autre'
    | 'regularisation_manuelle';
  sourceId: string | null;
  montant: number;
  canal: CanalCaisse;
  statut: 'initiee' | 'confirmee' | 'remboursee' | 'annulee';
  motif: string | null;
  payeurPersonneId: string | null;
  payeurExterneNom: string | null;
  payeurExterneEmail: string | null;
  recueLe: string;
}

export interface CaisseDetail {
  caisse: Caisse;
  receptacles: Receptacle[];
  entrees: TransactionEntrante[];
  transactions: TransactionSortante[];
}

/**
 * Charge le détail complet d'une caisse pour la page admin (V2.3.18).
 * 3 requêtes parallèles : caisse + ses réceptacles + ses transactions
 * sortantes. Retourne `null` si la caisse n'existe pas (404 côté page).
 */
export async function chargerCaissePourDetail(caisseId: string): Promise<CaisseDetail | null> {
  const supabase = await getSupabaseServer();
  const [caisseRes, receptaclesRes, transactionsRes] = await Promise.all([
    supabase.from('caisse').select(CAISSE_CHAMPS).eq('id', caisseId).maybeSingle(),
    supabase
      .from('receptacle_caisse')
      .select('*')
      .eq('caisse_id', caisseId)
      .order('valide_du', { ascending: false }),
    supabase
      .from('transaction_sortante')
      .select('*')
      .eq('caisse_id', caisseId)
      .order('initie_le', { ascending: false }),
  ]);

  if (caisseRes.data === null) return null;

  // Charge aussi les entrées (V2.3.28).
  const { data: entreesData } = await supabase
    .from('transaction_entrante')
    .select('*')
    .eq('caisse_id', caisseId)
    .order('recue_le', { ascending: false })
    .limit(200);

  return {
    caisse: ligneEnCaisse(caisseRes.data),
    receptacles: (receptaclesRes.data ?? []).map((r) => ({
      id: r.id,
      caisseId: r.caisse_id,
      canal: r.canal as CanalCaisse,
      identifiantReceptacle: r.identifiant_receptacle,
      metadata: r.metadata,
      valideDu: r.valide_du,
      valideAu: r.valide_au,
      createdAt: r.created_at,
    })),
    entrees: (entreesData ?? []).map((e) => ({
      id: e.id,
      caisseId: e.caisse_id,
      receptacleId: e.receptacle_id,
      sourceType: e.source_type as
        | 'don'
        | 'adhesion'
        | 'cagnotte'
        | 'cotisation_solidaire'
        | 'autre'
        | 'regularisation_manuelle',
      sourceId: e.source_id,
      montant: Number(e.montant),
      canal: e.canal as CanalCaisse,
      statut: e.statut as 'initiee' | 'confirmee' | 'remboursee' | 'annulee',
      motif: e.motif,
      payeurPersonneId: e.payeur_personne_id,
      payeurExterneNom: e.payeur_externe_nom,
      payeurExterneEmail: e.payeur_externe_email,
      recueLe: e.recue_le,
    })),
    transactions: (transactionsRes.data ?? []).map((t) => ({
      id: t.id,
      caisseId: t.caisse_id,
      receptacleId: t.receptacle_id,
      beneficiairePersonneId: t.beneficiaire_personne_id,
      beneficiaireExterneNom: t.beneficiaire_externe_nom,
      beneficiaireExterneIbanOuWallet: t.beneficiaire_externe_iban_ou_wallet,
      montant: t.montant,
      canal: t.canal as CanalCaisse,
      statut: t.statut as StatutTransactionSortante,
      motif: t.motif,
      justificatifStoragePath: t.justificatif_storage_path,
      justificatifNomOriginal: t.justificatif_nom_original,
      justificatifMimeType: t.justificatif_mime_type,
      initiePersonneId: t.initie_par_personne_id,
      initieLe: t.initie_le,
      confirmeLe: t.confirme_le,
    })),
  };
}

function ligneEnCaisse(c: {
  id: string;
  type_caisse: string;
  libelle: string;
  objet_type: string | null;
  objet_id: string | null;
  statut: string;
  metadata: unknown;
  ouverte_le: string;
  fermee_le: string | null;
  created_at: string;
  updated_at: string;
}): Caisse {
  return {
    id: c.id,
    typeCaisse: c.type_caisse as Caisse['typeCaisse'],
    libelle: c.libelle,
    objetType: (c.objet_type as Caisse['objetType']) ?? null,
    objetId: c.objet_id ?? null,
    statut: c.statut as Caisse['statut'],
    metadata: c.metadata as Caisse['metadata'],
    ouverteLe: c.ouverte_le,
    fermeeLe: c.fermee_le,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

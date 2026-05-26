/**
 * Helpers de lecture pour le dashboard trésorerie (cycle V2 V2.3.10).
 *
 * Lectures uniquement (pas d'écriture). Les actions (créer une caisse,
 * poser un réceptacle, initier un reversement) sont déjà disponibles dans
 * `lib/caisse.ts` (V2.2.3) ; cette couche se contente d'agréger pour la
 * vue admin nationale.
 */

import type { Caisse } from '@/lib/caisse';
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
    caisse: {
      id: c.id,
      typeCaisse: c.type_caisse as Caisse['typeCaisse'],
      libelle: c.libelle,
      objetType: (c.objet_type as Caisse['objetType']) ?? null,
      objetId: c.objet_id ?? null,
      statut: c.statut as Caisse['statut'],
      metadata: c.metadata,
      ouverteLe: c.ouverte_le,
      fermeeLe: c.fermee_le,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    },
    nbReceptaclesActifs: nbReceptaclesParCaisse.get(c.id) ?? 0,
    nbTransactionsSortantes: nbTransactionsParCaisse.get(c.id) ?? 0,
    derniereTransactionLe: derniereTransactionParCaisse.get(c.id) ?? null,
  }));
}

/**
 * Helpers pour la section « Mes contributions financières »
 * (cycle V2 V2.3.31).
 *
 * Lit les entrées dans `transaction_entrante` (V2.3.26) où
 * `payeur_personne_id = session.userId`. La RLS `select_admin_payeur`
 * autorise déjà la lecture sans appel de service_role.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ContributionFinanciere {
  id: string;
  sourceType:
    | 'don'
    | 'adhesion'
    | 'cagnotte'
    | 'cotisation_solidaire'
    | 'autre'
    | 'regularisation_manuelle';
  sourceId: string | null;
  montant: number;
  canal: 'euro' | '99_coin';
  statut: 'initiee' | 'confirmee' | 'remboursee' | 'annulee';
  motif: string | null;
  recueLe: string;
}

export interface RecapContributions {
  total: number;
  parCanal: {
    euro: { nb: number; somme: number };
    coin99: { nb: number; somme: number };
  };
  parSource: Record<ContributionFinanciere['sourceType'], number>;
}

/**
 * Liste les contributions confirmées + initiées de la personne, tri date desc.
 */
export async function listerMesContributions(
  personneId: string,
): Promise<ContributionFinanciere[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('transaction_entrante')
    .select('id, source_type, source_id, montant, canal, statut, motif, recue_le')
    .eq('payeur_personne_id', personneId)
    .in('statut', ['initiee', 'confirmee'])
    .order('recue_le', { ascending: false })
    .limit(200);

  if (error !== null || data === null) return [];
  return data.map((e) => ({
    id: e.id,
    sourceType: e.source_type as ContributionFinanciere['sourceType'],
    sourceId: e.source_id,
    montant: Number(e.montant),
    canal: e.canal as 'euro' | '99_coin',
    statut: e.statut as ContributionFinanciere['statut'],
    motif: e.motif,
    recueLe: e.recue_le,
  }));
}

/** Calcule un récap à partir d'une liste de contributions. */
export function calculerRecap(contributions: ContributionFinanciere[]): RecapContributions {
  const parSource: RecapContributions['parSource'] = {
    don: 0,
    adhesion: 0,
    cagnotte: 0,
    cotisation_solidaire: 0,
    autre: 0,
    regularisation_manuelle: 0,
  };
  const parCanal = {
    euro: { nb: 0, somme: 0 },
    coin99: { nb: 0, somme: 0 },
  };
  for (const c of contributions) {
    if (c.statut !== 'confirmee') continue;
    parSource[c.sourceType] += 1;
    const cle = c.canal === 'euro' ? 'euro' : 'coin99';
    parCanal[cle].nb += 1;
    parCanal[cle].somme += c.montant;
  }
  return { total: contributions.length, parCanal, parSource };
}

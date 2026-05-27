/**
 * Calcul du solde d'une caisse (cycle V2 V2.3.26).
 *
 * Solde = somme des entrées confirmées − somme des sorties confirmées,
 * par canal (euro vs 99-coin). Les entrées/sorties en statut `initiee`,
 * `annulee`, `remboursee` ou `litige` ne comptent pas.
 *
 * 2 requêtes parallèles (`Promise.all`) côté Postgres avec agrégation
 * SQL côté serveur. Pas d'agrégation côté TS pour éviter de transférer
 * toutes les lignes.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface SoldeCaisse {
  caisseId: string;
  /** Sous-totaux par canal. */
  euro: { entrees: number; sorties: number; solde: number };
  coin99: { entrees: number; sorties: number; solde: number };
}

/**
 * Charge le solde d'une caisse. Agrège côté DB pour les performances.
 * Les transactions `initiee` côté entrée ET `confirmee` côté sortie ne
 * sont PAS comptées en faveur du solde (pour rester prudent : on n'a pas
 * encore l'argent en banque tant que pas confirmé, et la sortie part au
 * débit du solde dès qu'elle est validée comptablement).
 */
export async function calculerSoldeCaisse(caisseId: string): Promise<SoldeCaisse> {
  const supabase = await getSupabaseServer();

  const [entreesRes, sortiesRes] = await Promise.all([
    supabase
      .from('transaction_entrante')
      .select('canal, montant')
      .eq('caisse_id', caisseId)
      .eq('statut', 'confirmee'),
    supabase
      .from('transaction_sortante')
      .select('canal, montant')
      .eq('caisse_id', caisseId)
      .eq('statut', 'confirmee'),
  ]);

  const totaux = {
    euro: { entrees: 0, sorties: 0 },
    coin99: { entrees: 0, sorties: 0 },
  };

  for (const e of entreesRes.data ?? []) {
    const cle = e.canal === 'euro' ? 'euro' : 'coin99';
    totaux[cle].entrees += Number(e.montant);
  }
  for (const s of sortiesRes.data ?? []) {
    const cle = s.canal === 'euro' ? 'euro' : 'coin99';
    totaux[cle].sorties += Number(s.montant);
  }

  return {
    caisseId,
    euro: {
      entrees: totaux.euro.entrees,
      sorties: totaux.euro.sorties,
      solde: totaux.euro.entrees - totaux.euro.sorties,
    },
    coin99: {
      entrees: totaux.coin99.entrees,
      sorties: totaux.coin99.sorties,
      solde: totaux.coin99.entrees - totaux.coin99.sorties,
    },
  };
}

/**
 * Variante batch : calcule les soldes de plusieurs caisses en deux
 * requêtes. Utile pour le dashboard trésorerie.
 */
export async function calculerSoldesCaisses(
  caisseIds: string[],
): Promise<Map<string, SoldeCaisse>> {
  const resultat = new Map<string, SoldeCaisse>();
  if (caisseIds.length === 0) return resultat;
  const supabase = await getSupabaseServer();

  const [entreesRes, sortiesRes] = await Promise.all([
    supabase
      .from('transaction_entrante')
      .select('caisse_id, canal, montant')
      .in('caisse_id', caisseIds)
      .eq('statut', 'confirmee'),
    supabase
      .from('transaction_sortante')
      .select('caisse_id, canal, montant')
      .in('caisse_id', caisseIds)
      .eq('statut', 'confirmee'),
  ]);

  for (const id of caisseIds) {
    resultat.set(id, {
      caisseId: id,
      euro: { entrees: 0, sorties: 0, solde: 0 },
      coin99: { entrees: 0, sorties: 0, solde: 0 },
    });
  }

  for (const e of entreesRes.data ?? []) {
    const s = resultat.get(e.caisse_id);
    if (s === undefined) continue;
    const cle = e.canal === 'euro' ? 'euro' : 'coin99';
    s[cle].entrees += Number(e.montant);
    s[cle].solde = s[cle].entrees - s[cle].sorties;
  }
  for (const t of sortiesRes.data ?? []) {
    const s = resultat.get(t.caisse_id);
    if (s === undefined) continue;
    const cle = t.canal === 'euro' ? 'euro' : 'coin99';
    s[cle].sorties += Number(t.montant);
    s[cle].solde = s[cle].entrees - s[cle].sorties;
  }

  return resultat;
}

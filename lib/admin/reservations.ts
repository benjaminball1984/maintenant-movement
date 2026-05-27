import { getSupabaseServer } from '@/lib/supabase';

export interface LigneReservationAdmin {
  id: string;
  offreType: string;
  offreId: string;
  demandeurPersonneId: string;
  debut: string | null;
  fin: string | null;
  quantite: number;
  messageAmorce: string;
  statut: string;
  motifDecision: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OptionsListeReservations {
  motCle?: string;
  statut?:
    | 'tous'
    | 'proposee'
    | 'acceptee'
    | 'refusee'
    | 'realisee'
    | 'confirmee'
    | 'annulee'
    | 'litige';
  offreType?: string;
  limite?: number;
}

/**
 * Liste les réservations pour la console admin (V2.4.60).
 *
 * Cycle D8 : proposee → acceptee/refusee → realisee → confirmee/litige
 * → annulee. Filtres motCle (sur message_amorce), statut, type d'offre.
 */
export async function listerReservationsAdmin(
  options: OptionsListeReservations = {},
): Promise<LigneReservationAdmin[]> {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from('reservation')
    .select(
      'id, offre_type, offre_id, demandeur_personne_id, creneau_debut, creneau_fin, quantite, message_amorce, statut, motif_decision, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(options.limite ?? 100);

  if (options.statut !== undefined && options.statut !== 'tous') {
    query = query.eq('statut', options.statut);
  }

  if (options.offreType !== undefined && options.offreType.trim() !== '') {
    query = query.eq('offre_type', options.offreType.trim());
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    query = query.ilike('message_amorce', `%${options.motCle.trim()}%`);
  }

  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id,
    offreType: r.offre_type,
    offreId: r.offre_id,
    demandeurPersonneId: r.demandeur_personne_id,
    debut: r.creneau_debut,
    fin: r.creneau_fin,
    quantite: r.quantite,
    messageAmorce: r.message_amorce,
    statut: r.statut,
    motifDecision: r.motif_decision,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

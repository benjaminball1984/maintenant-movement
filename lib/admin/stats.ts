import { getSupabaseServer } from '@/lib/supabase';

/**
 * Stats globales pour le tableau de bord admin (chantier 9.2).
 *
 * Toutes les requêtes utilisent le client server-side (respecte la RLS,
 * donc une personne sans droits admin verra 0 partout, ce qui est OK
 * puisque le layout filtre déjà l'accès).
 */

export interface StatsAdmin {
  personnes: number;
  adherentsActifs: number;
  petitionsPubliees: number;
  mobilisationsPubliees: number;
  cagnottesPubliees: number;
  totalEurosCollectes: number;
  totalT99CPCollectes: number;
  servicesSel: number;
  prestationsCreditees: number;
  produitsMarche: number;
  momentsAVenir: number;
  mediasPublies: number;
  sondagesOuverts: number;
  communesPreCreees: number;
  mandatsAssemblee: number;
  // V2.3.42 : indicateurs V2 ajoutés.
  caissesOuvertes: number;
  totalEurosCaisses: number;
  totalCoin99Caisses: number;
  transactionsSortantesInitiees: number;
  transactionsSortantesConfirmees: number;
  reservationsTotal: number;
  reservationsEnAttente: number;
  reservationsEnLitige: number;
  membresCampagnes: number;
  membresGTs: number;
  membresGroupesEntraide: number;
}

export async function chargerStatsAdmin(): Promise<StatsAdmin> {
  const supabase = await getSupabaseServer();

  const [
    personnes,
    adherents,
    petitions,
    mobilisations,
    cagnottes,
    sel,
    prestations,
    produits,
    moments,
    medias,
    sondages,
    communes,
    mandats,
    dons,
  ] = await Promise.all([
    supabase.from('personne').select('id', { count: 'exact', head: true }),
    supabase.from('adherent_actif').select('personne_id', { count: 'exact', head: true }),
    supabase.from('petition').select('id', { count: 'exact', head: true }).eq('statut', 'publiee'),
    supabase
      .from('mobilisation')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'publiee'),
    supabase.from('cagnotte').select('id', { count: 'exact', head: true }).eq('statut', 'publiee'),
    supabase
      .from('service_sel')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'publie'),
    supabase
      .from('prestation_sel')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'creditee'),
    supabase
      .from('produit_marche')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'disponible'),
    supabase
      .from('moment_solidaire')
      .select('id', { count: 'exact', head: true })
      .in('statut', ['annonce', 'en_cours']),
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('statut', 'publie'),
    supabase.from('sondage').select('id', { count: 'exact', head: true }).eq('statut', 'ouvert'),
    supabase
      .from('commune')
      .select('id', { count: 'exact', head: true })
      .eq('statut_creation', 'pre_creee'),
    supabase
      .from('mandat_confederal')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'actif'),
    supabase.from('don').select('monnaie, montant_centimes').eq('statut', 'confirme'),
  ]);

  let totalEuros = 0;
  let totalT99CP = 0;
  for (const d of dons.data ?? []) {
    if (d.monnaie === 'EUR') totalEuros += d.montant_centimes;
    else if (d.monnaie === 'T99CP') totalT99CP += d.montant_centimes;
  }

  return {
    personnes: personnes.count ?? 0,
    adherentsActifs: adherents.count ?? 0,
    petitionsPubliees: petitions.count ?? 0,
    mobilisationsPubliees: mobilisations.count ?? 0,
    cagnottesPubliees: cagnottes.count ?? 0,
    totalEurosCollectes: totalEuros,
    totalT99CPCollectes: totalT99CP,
    servicesSel: sel.count ?? 0,
    prestationsCreditees: prestations.count ?? 0,
    produitsMarche: produits.count ?? 0,
    momentsAVenir: moments.count ?? 0,
    mediasPublies: medias.count ?? 0,
    sondagesOuverts: sondages.count ?? 0,
    communesPreCreees: communes.count ?? 0,
    mandatsAssemblee: mandats.count ?? 0,
    ...(await chargerStatsV2(supabase)),
  };
}

/**
 * Indicateurs V2.3.42 (caisses, transactions, réservations, appartenances).
 * Bloc séparé pour faciliter la lecture et l'évolution future.
 */
async function chargerStatsV2(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
): Promise<
  Pick<
    StatsAdmin,
    | 'caissesOuvertes'
    | 'totalEurosCaisses'
    | 'totalCoin99Caisses'
    | 'transactionsSortantesInitiees'
    | 'transactionsSortantesConfirmees'
    | 'reservationsTotal'
    | 'reservationsEnAttente'
    | 'reservationsEnLitige'
    | 'membresCampagnes'
    | 'membresGTs'
    | 'membresGroupesEntraide'
  >
> {
  const [
    caisses,
    entrees,
    sorties,
    txInit,
    txConf,
    resTotal,
    resAttente,
    resLitige,
    membresCamp,
    membresGT,
    membresGroupe,
  ] = await Promise.all([
    supabase.from('caisse').select('id', { count: 'exact', head: true }).eq('statut', 'ouverte'),
    supabase.from('transaction_entrante').select('montant, canal').eq('statut', 'confirmee'),
    supabase.from('transaction_sortante').select('montant, canal').eq('statut', 'confirmee'),
    supabase
      .from('transaction_sortante')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'initiee'),
    supabase
      .from('transaction_sortante')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'confirmee'),
    supabase.from('reservation').select('id', { count: 'exact', head: true }),
    supabase
      .from('reservation')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'proposee'),
    supabase
      .from('reservation')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'litige'),
    supabase
      .from('appartenance_campagne')
      .select('id', { count: 'exact', head: true })
      .eq('est_active', true),
    supabase
      .from('appartenance_gt')
      .select('id', { count: 'exact', head: true })
      .eq('est_active', true),
    supabase
      .from('appartenance_groupe_entraide_local')
      .select('id', { count: 'exact', head: true })
      .eq('est_active', true),
  ]);

  let entreesEuro = 0;
  let entreesCoin99 = 0;
  for (const e of entrees.data ?? []) {
    if (e.canal === 'euro') entreesEuro += Number(e.montant);
    else entreesCoin99 += Number(e.montant);
  }
  let sortiesEuro = 0;
  let sortiesCoin99 = 0;
  for (const s of sorties.data ?? []) {
    if (s.canal === 'euro') sortiesEuro += Number(s.montant);
    else sortiesCoin99 += Number(s.montant);
  }

  return {
    caissesOuvertes: caisses.count ?? 0,
    totalEurosCaisses: entreesEuro - sortiesEuro,
    totalCoin99Caisses: entreesCoin99 - sortiesCoin99,
    transactionsSortantesInitiees: txInit.count ?? 0,
    transactionsSortantesConfirmees: txConf.count ?? 0,
    reservationsTotal: resTotal.count ?? 0,
    reservationsEnAttente: resAttente.count ?? 0,
    reservationsEnLitige: resLitige.count ?? 0,
    membresCampagnes: membresCamp.count ?? 0,
    membresGTs: membresGT.count ?? 0,
    membresGroupesEntraide: membresGroupe.count ?? 0,
  };
}

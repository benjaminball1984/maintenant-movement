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
  };
}

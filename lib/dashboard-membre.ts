/**
 * Couche de données du dashboard membre (V2.4.5).
 *
 * Agrège l'ensemble des compteurs personnels et des activités récentes
 * de la personne connectée. Server-side, RLS Supabase active.
 *
 * 1 seule fonction publique : `chargerDashboardMembre(personneId)`.
 * 13 requêtes en parallèle via Promise.all.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface DashboardMembre {
  // Stats globales
  nbSignatures: number;
  nbReservationsDemandees: number;
  nbReservationsRecues: number;
  nbReservationsEnAttente: number;
  nbContributions: number;
  totalEurosContribues: number;
  nbGroupes: number;
  nbNotificationsNonLues: number;
  nbMessagesNonLus: number;

  // Adhésion
  adhesionActive: {
    id: string;
    chemin: string;
    debuteLe: string;
    expireLe: string;
    montantEurosCentimes: number | null;
  } | null;

  // Activités récentes (5 dernières)
  activitesRecentes: ActiviteRecente[];
}

export interface ActiviteRecente {
  type:
    | 'signature_petition'
    | 'don'
    | 'reservation_creee'
    | 'reservation_recue'
    | 'post_reseau'
    | 'adhesion';
  titre: string;
  sousTitre: string | null;
  href: string;
  date: string;
}

export async function chargerDashboardMembre(personneId: string): Promise<DashboardMembre> {
  const supabase = await getSupabaseServer();

  const [
    signatures,
    resDemandees,
    resAttente,
    contributions,
    contribsConfirmees,
    notifsNonLues,
    messagesNonLus,
    adhesions,
    appCommunes,
    appGts,
    appCampagnes,
    appGroupes,
    derniersDons,
    dernieresSignatures,
    derniersPosts,
  ] = await Promise.all([
    supabase
      .from('signature_petition')
      .select('id', { count: 'exact', head: true })
      .eq('personne_id', personneId),
    supabase
      .from('reservation')
      .select('id', { count: 'exact', head: true })
      .eq('demandeur_personne_id', personneId),
    supabase
      .from('reservation')
      .select('id', { count: 'exact', head: true })
      .eq('demandeur_personne_id', personneId)
      .in('statut', ['proposee', 'acceptee']),
    supabase
      .from('transaction_entrante')
      .select('id', { count: 'exact', head: true })
      .eq('payeur_personne_id', personneId)
      .in('statut', ['initiee', 'confirmee']),
    supabase
      .from('transaction_entrante')
      .select('montant, canal')
      .eq('payeur_personne_id', personneId)
      .eq('statut', 'confirmee'),
    supabase
      .from('notification')
      .select('id', { count: 'exact', head: true })
      .eq('destinataire_id', personneId)
      .eq('lue', false),
    supabase
      .from('message_reseau')
      .select('id', { count: 'exact', head: true })
      .eq('destinataire_id', personneId)
      .eq('lu', false),
    supabase
      .from('adhesion')
      .select('id, chemin, debute_le, expire_le, montant_euros_centimes')
      .eq('personne_id', personneId)
      .gt('expire_le', new Date().toISOString())
      .order('debute_le', { ascending: false })
      .limit(1),
    supabase
      .from('appartenance_commune')
      .select('id', { count: 'exact', head: true })
      .eq('personne_id', personneId)
      .eq('est_active', true),
    supabase
      .from('appartenance_gt')
      .select('id', { count: 'exact', head: true })
      .eq('personne_id', personneId)
      .eq('est_active', true),
    supabase
      .from('appartenance_campagne')
      .select('id', { count: 'exact', head: true })
      .eq('personne_id', personneId)
      .eq('est_active', true),
    supabase
      .from('appartenance_groupe_entraide_local')
      .select('id', { count: 'exact', head: true })
      .eq('personne_id', personneId)
      .eq('est_active', true),
    supabase
      .from('transaction_entrante')
      .select('id, source_type, montant, canal, recue_le, motif')
      .eq('payeur_personne_id', personneId)
      .eq('statut', 'confirmee')
      .order('recue_le', { ascending: false })
      .limit(3),
    supabase
      .from('signature_petition')
      .select('id, petition_id, created_at')
      .eq('personne_id', personneId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('post_reseau')
      .select('id, texte, created_at')
      .eq('auteurice_id', personneId)
      .eq('statut', 'publie')
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  let totalEurosCent = 0;
  for (const c of contribsConfirmees.data ?? []) {
    if (c.canal === 'euro') totalEurosCent += Number(c.montant) * 100;
  }

  const adhesion = adhesions.data?.[0] ?? null;

  // Activités récentes : fusion + tri par date
  const activites: ActiviteRecente[] = [];
  for (const d of derniersDons.data ?? []) {
    activites.push({
      type: 'don',
      titre:
        d.source_type === 'don'
          ? 'Don à une cagnotte'
          : d.source_type === 'adhesion'
            ? 'Adhésion'
            : 'Contribution',
      sousTitre: d.canal === 'euro' ? `${Number(d.montant).toFixed(2)} €` : `${d.montant} 99c`,
      href: '/profil/contributions',
      date: d.recue_le,
    });
  }
  for (const s of dernieresSignatures.data ?? []) {
    activites.push({
      type: 'signature_petition',
      titre: 'Pétition signée',
      sousTitre: null,
      href: '/profil/contributions',
      date: s.created_at,
    });
  }
  for (const p of derniersPosts.data ?? []) {
    activites.push({
      type: 'post_reseau',
      titre: 'Publication réseau',
      sousTitre: p.texte.slice(0, 80),
      href: '/s-informer/reseau',
      date: p.created_at,
    });
  }
  if (adhesion !== null) {
    activites.push({
      type: 'adhesion',
      titre: `Adhésion en cours (${adhesion.chemin})`,
      sousTitre: `expire le ${new Date(adhesion.expire_le).toLocaleDateString('fr-FR')}`,
      href: '/agir/adherer',
      date: adhesion.debute_le,
    });
  }
  activites.sort((a, b) => (a.date < b.date ? 1 : -1));

  const nbGroupes =
    (appCommunes.count ?? 0) +
    (appGts.count ?? 0) +
    (appCampagnes.count ?? 0) +
    (appGroupes.count ?? 0);

  return {
    nbSignatures: signatures.count ?? 0,
    nbReservationsDemandees: resDemandees.count ?? 0,
    nbReservationsRecues: 0, // calculé séparément (FK polymorphe)
    nbReservationsEnAttente: resAttente.count ?? 0,
    nbContributions: contributions.count ?? 0,
    totalEurosContribues: totalEurosCent / 100,
    nbGroupes,
    nbNotificationsNonLues: notifsNonLues.count ?? 0,
    nbMessagesNonLus: messagesNonLus.count ?? 0,
    adhesionActive:
      adhesion === null
        ? null
        : {
            id: adhesion.id,
            chemin: adhesion.chemin,
            debuteLe: adhesion.debute_le,
            expireLe: adhesion.expire_le,
            montantEurosCentimes: adhesion.montant_euros_centimes,
          },
    activitesRecentes: activites.slice(0, 5),
  };
}

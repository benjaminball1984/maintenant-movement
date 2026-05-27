import { getSupabaseServer } from '@/lib/supabase';

/**
 * Couche de données de l'agenda agrégé (chantier 6.2).
 *
 * Cf. spec §8B « Agenda agrégé » : miroir temporel de la carte unifiée.
 * Agrège tout ce qui est public dans le temps :
 *   - Mobilisations (3.2)
 *   - Moments solidaires — porte-à-porte, tri, repas, distribution,
 *     maraudes (5.3)
 *   - Minimarchés solidaires (4.3)
 *   - Boutiques éphémères ouvertes (4.3) avec date de début
 *
 * Navigation à venir (chantier polish) : par localité, département,
 * date. Pour 6.2 v1, on retourne la liste triée temporellement et le
 * composant filtre par date dans l'URL.
 */

export type TypeEvenement =
  | 'mobilisation'
  | 'moment_solidaire'
  | 'minimarche'
  | 'boutique_marche'
  | 'sondage';

export interface EvenementAgenda {
  id: string;
  type: TypeEvenement;
  titre: string;
  /** ISO 8601, début de l'événement. */
  commence_le: string;
  /** ISO 8601, fin de l'événement (null si non précisé). */
  termine_le: string | null;
  lieu: string | null;
  departement: string | null;
  /** Lien interne vers la fiche. */
  href: string;
}

export interface FiltreAgenda {
  /** Filtre par jour (YYYY-MM-DD). Inclut tout ce qui commence ce jour-là. */
  jour?: string;
  /** Filtre par département (code 2 chiffres). Mobilisations + moments + minimarchés. */
  departement?: string;
  /** Filtre par type d'événement. */
  type?: TypeEvenement;
}

const LIMITE_PAR_SOURCE = 200;

/**
 * Agrège tous les événements publics datés. Retourne triés par
 * `commence_le` croissant. `limite` borne le total renvoyé (50 par
 * défaut côté UI ; 1000 max ici pour le batch côté agrégation).
 */
export async function chargerEvenementsAgenda(
  filtre: FiltreAgenda = {},
  limite = 200,
): Promise<EvenementAgenda[]> {
  const supabase = await getSupabaseServer();
  const aujourdhui = new Date().toISOString();

  const [
    { data: mobilisations },
    { data: moments },
    { data: minimarches },
    { data: boutiques },
    { data: sondages },
  ] = await Promise.all([
    supabase
      .from('mobilisation')
      .select('id, titre, slug, date_debut, date_fin, lieu')
      .eq('statut', 'publiee')
      .gte('date_debut', aujourdhui)
      .order('date_debut', { ascending: true })
      .limit(LIMITE_PAR_SOURCE),
    supabase
      .from('moment_solidaire')
      .select('id, titre, slug, commence_le, termine_le, lieu, type')
      .in('statut', ['annonce', 'en_cours'])
      .gte('commence_le', aujourdhui)
      .order('commence_le', { ascending: true })
      .limit(LIMITE_PAR_SOURCE),
    supabase
      .from('minimarche_solidaire')
      .select('id, titre, slug, commence_le, termine_le, lieu')
      .in('statut', ['annonce', 'en_cours'])
      .gte('commence_le', aujourdhui)
      .order('commence_le', { ascending: true })
      .limit(LIMITE_PAR_SOURCE),
    supabase
      .from('boutique_marche')
      .select('id, nom, slug, ouverte_du, ouverte_au, lieu')
      .eq('statut', 'ouverte')
      .not('ouverte_du', 'is', null)
      .gte('ouverte_du', aujourdhui)
      .order('ouverte_du', { ascending: true })
      .limit(LIMITE_PAR_SOURCE),
    supabase
      .from('sondage')
      .select('id, titre, slug, ferme_le, question')
      .eq('statut', 'ouvert')
      .not('ferme_le', 'is', null)
      .gte('ferme_le', aujourdhui)
      .order('ferme_le', { ascending: true })
      .limit(LIMITE_PAR_SOURCE),
  ]);

  const evenements: EvenementAgenda[] = [];

  for (const m of mobilisations ?? []) {
    evenements.push({
      id: m.id,
      type: 'mobilisation',
      titre: m.titre,
      commence_le: m.date_debut,
      termine_le: m.date_fin,
      lieu: m.lieu,
      departement: extraireDepartement(m.lieu),
      href: `/mobiliser/mobilisations/${m.slug}`,
    });
  }

  for (const ms of moments ?? []) {
    evenements.push({
      id: ms.id,
      type: 'moment_solidaire',
      titre: ms.titre,
      commence_le: ms.commence_le,
      termine_le: ms.termine_le,
      lieu: ms.lieu,
      departement: extraireDepartement(ms.lieu),
      href: `/agir/moments-solidaires/${ms.slug}`,
    });
  }

  for (const mm of minimarches ?? []) {
    evenements.push({
      id: mm.id,
      type: 'minimarche',
      titre: mm.titre,
      commence_le: mm.commence_le,
      termine_le: mm.termine_le,
      lieu: mm.lieu,
      departement: extraireDepartement(mm.lieu),
      href: `/s-entraider/marche/minimarches/${mm.slug}`,
    });
  }

  for (const b of boutiques ?? []) {
    if (b.ouverte_du === null) continue;
    evenements.push({
      id: b.id,
      type: 'boutique_marche',
      titre: b.nom,
      commence_le: b.ouverte_du,
      termine_le: b.ouverte_au,
      lieu: b.lieu,
      departement: extraireDepartement(b.lieu),
      href: `/s-entraider/marche/boutiques/${b.slug}`,
    });
  }

  for (const s of sondages ?? []) {
    if (s.ferme_le === null) continue;
    evenements.push({
      id: s.id,
      type: 'sondage',
      titre: `Clôture sondage : ${s.titre}`,
      commence_le: s.ferme_le,
      termine_le: null,
      lieu: null,
      departement: null,
      href: `/s-informer/sondages/${s.slug}`,
    });
  }

  let resultat = evenements;
  if (filtre.type !== undefined) {
    resultat = resultat.filter((e) => e.type === filtre.type);
  }
  if (filtre.departement !== undefined && filtre.departement !== '') {
    resultat = resultat.filter((e) => e.departement === filtre.departement);
  }
  if (filtre.jour !== undefined && filtre.jour !== '') {
    resultat = resultat.filter((e) => e.commence_le.slice(0, 10) === filtre.jour);
  }

  resultat.sort((a, b) => a.commence_le.localeCompare(b.commence_le));
  return resultat.slice(0, limite);
}

/**
 * Extrait un code département à partir d'un lieu libre (heuristique).
 * Recherche un code postal français à 5 chiffres et garde les 2
 * premiers. Renvoie null si non trouvable.
 */
function extraireDepartement(lieu: string | null): string | null {
  if (lieu === null) return null;
  const m = lieu.match(/\b(\d{2})\d{3}\b/);
  return m === null ? null : (m[1] ?? null);
}

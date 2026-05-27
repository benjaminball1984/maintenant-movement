import { getSupabaseServer } from '@/lib/supabase';

/**
 * Couche de données de la carte unifiée (chantier 6.1 — enrichi).
 *
 * Spec §8A : « bases de données séparées par espace, agrégation à
 * l'affichage (pas une table monolithique) ». On agrège ici, au moment
 * de servir la page `/carte`, toutes les sources géolocalisées.
 *
 * Sources couvertes par 6.1 :
 *   - mobilisations          (3.2)
 *   - offres d'entraide      (4.1) — 4 sous-types via le type discriminant
 *   - SEL                    (4.2)
 *   - marché produits        (4.3)
 *   - boutiques marché       (4.3)
 *   - minimarchés            (4.3)
 *   - moments solidaires     (5.3)
 *
 * Quand un nouveau type géolocalisé arrivera (sondages locaux 7.4),
 * il suffira d'ajouter une étape de chargement et une entrée dans le
 * composant `<CarteUnifiee>` (LIBELLE_PAR_TYPE + COULEUR_PAR_TYPE).
 */

export type TypePoint =
  | 'mobilisation'
  | 'entraide_hebergement'
  | 'entraide_transport'
  | 'entraide_pret_objet'
  | 'entraide_fruits_terre'
  | 'sel'
  | 'produit_marche'
  | 'boutique_marche'
  | 'minimarche'
  | 'moment_solidaire'
  | 'sondage'
  | 'groupe_entraide';

export interface PointCarte {
  id: string;
  type: TypePoint;
  titre: string;
  slug: string;
  latitude: number;
  longitude: number;
  /** Sous-titre court affiché en popup (lieu, date, ...). */
  sous_titre: string | null;
  /** Lien interne vers la fiche détail. */
  href: string;
}

const FORMATEUR_DATE_COURT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: 'numeric',
});

/**
 * Agrège tous les points géolocalisés pour la carte. Type union
 * discriminé : facile à itérer côté carte client sans charger N
 * requêtes différentes.
 */
export async function chargerPointsCarte(): Promise<PointCarte[]> {
  const supabase = await getSupabaseServer();

  const [
    { data: mobilisations },
    { data: offres },
    { data: services },
    { data: produits },
    { data: boutiques },
    { data: minimarches },
    { data: moments },
    { data: sondages },
    { data: groupes },
  ] = await Promise.all([
    supabase
      .from('mobilisation')
      .select('id, titre, slug, latitude, longitude, lieu, date_debut')
      .eq('statut', 'publiee')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('date_debut', { ascending: true })
      .limit(500),
    supabase
      .from('offre_entraide')
      .select('id, titre, slug, latitude, longitude, lieu, type')
      .eq('statut', 'publiee')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(500),
    supabase
      .from('service_sel')
      .select('id, titre, slug, latitude, longitude, lieu, categorie')
      .eq('statut', 'publie')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(500),
    supabase
      .from('produit_marche')
      .select('id, titre, slug, latitude, longitude, lieu, mode')
      .eq('statut', 'disponible')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(500),
    supabase
      .from('boutique_marche')
      .select('id, nom, slug, latitude, longitude, lieu')
      .eq('statut', 'ouverte')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(200),
    supabase
      .from('minimarche_solidaire')
      .select('id, titre, slug, latitude, longitude, lieu, commence_le')
      .in('statut', ['annonce', 'en_cours'])
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(200),
    supabase
      .from('moment_solidaire')
      .select('id, titre, slug, latitude, longitude, lieu, commence_le, type')
      .in('statut', ['annonce', 'en_cours'])
      .is('parent_id', null)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(500),
    supabase
      .from('sondage')
      .select('id, titre, slug, latitude, longitude, question, ferme_le')
      .eq('statut', 'ouvert')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(300),
    supabase
      .from('groupe_entraide_local')
      .select('id, nom, slug, latitude, longitude, zone_geographique')
      .eq('statut', 'publie')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(500),
  ]);

  const points: PointCarte[] = [];

  for (const m of mobilisations ?? []) {
    if (m.latitude === null || m.longitude === null) continue;
    points.push({
      id: m.id,
      type: 'mobilisation',
      titre: m.titre,
      slug: m.slug,
      latitude: m.latitude,
      longitude: m.longitude,
      sous_titre: `${m.lieu} · ${new Date(m.date_debut).toLocaleDateString('fr-FR')}`,
      href: `/mobiliser/mobilisations/${m.slug}`,
    });
  }

  // Les communes ne sont plus tracées sur la carte unifiée : elles ont leur
  // carte dédiée et clusterisée (/communes), capable d'afficher tout le
  // référentiel (~35 000 communes) sans noyer la vue d'activité ici.

  for (const o of offres ?? []) {
    if (o.latitude === null || o.longitude === null) continue;
    points.push({
      id: o.id,
      type: `entraide_${o.type}` as TypePoint,
      titre: o.titre,
      slug: o.slug,
      latitude: o.latitude,
      longitude: o.longitude,
      sous_titre: o.lieu,
      href: `/s-entraider/offre/${o.slug}`,
    });
  }

  for (const s of services ?? []) {
    if (s.latitude === null || s.longitude === null) continue;
    points.push({
      id: s.id,
      type: 'sel',
      titre: s.titre,
      slug: s.slug,
      latitude: s.latitude,
      longitude: s.longitude,
      sous_titre: `${s.lieu} · ${s.categorie === 'service' ? 'Service' : 'Volontariat'}`,
      href: `/s-entraider/sel/${s.slug}`,
    });
  }

  for (const p of produits ?? []) {
    if (p.latitude === null || p.longitude === null) continue;
    points.push({
      id: p.id,
      type: 'produit_marche',
      titre: p.titre,
      slug: p.slug,
      latitude: p.latitude,
      longitude: p.longitude,
      sous_titre: `${p.lieu} · ${p.mode === 'don' ? 'Don gratuit' : 'Vente'}`,
      href: `/s-entraider/marche/produits/${p.slug}`,
    });
  }

  for (const b of boutiques ?? []) {
    if (b.latitude === null || b.longitude === null) continue;
    points.push({
      id: b.id,
      type: 'boutique_marche',
      titre: b.nom,
      slug: b.slug,
      latitude: b.latitude,
      longitude: b.longitude,
      sous_titre: b.lieu,
      href: `/s-entraider/marche/boutiques/${b.slug}`,
    });
  }

  for (const mm of minimarches ?? []) {
    if (mm.latitude === null || mm.longitude === null) continue;
    points.push({
      id: mm.id,
      type: 'minimarche',
      titre: mm.titre,
      slug: mm.slug,
      latitude: mm.latitude,
      longitude: mm.longitude,
      sous_titre: `${mm.lieu} · ${FORMATEUR_DATE_COURT.format(new Date(mm.commence_le))}`,
      href: `/s-entraider/marche/minimarches/${mm.slug}`,
    });
  }

  for (const ms of moments ?? []) {
    if (ms.latitude === null || ms.longitude === null) continue;
    points.push({
      id: ms.id,
      type: 'moment_solidaire',
      titre: ms.titre,
      slug: ms.slug,
      latitude: ms.latitude,
      longitude: ms.longitude,
      sous_titre: `${ms.lieu} · ${FORMATEUR_DATE_COURT.format(new Date(ms.commence_le))}`,
      href: `/agir/moments-solidaires/${ms.slug}`,
    });
  }

  for (const s of sondages ?? []) {
    if (s.latitude === null || s.longitude === null) continue;
    points.push({
      id: s.id,
      type: 'sondage',
      titre: s.titre,
      slug: s.slug,
      latitude: s.latitude,
      longitude: s.longitude,
      sous_titre: s.question.slice(0, 80),
      href: `/s-informer/sondages/${s.slug}`,
    });
  }

  for (const g of groupes ?? []) {
    if (g.latitude === null || g.longitude === null) continue;
    points.push({
      id: g.id,
      type: 'groupe_entraide',
      titre: g.nom,
      slug: g.slug,
      latitude: g.latitude,
      longitude: g.longitude,
      sous_titre: g.zone_geographique,
      href: `/s-entraider/groupes-locaux/${g.slug}`,
    });
  }

  return points;
}

/**
 * Variante : ne charge QUE les hébergements solidaires. Pour la carte
 * spécialisée `/cartes/hebergements`.
 */
export async function chargerPointsHebergement(): Promise<PointCarte[]> {
  const supabase = await getSupabaseServer();
  const { data: offres } = await supabase
    .from('offre_entraide')
    .select('id, titre, slug, latitude, longitude, lieu, type')
    .eq('type', 'hebergement')
    .eq('statut', 'publiee')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(2000);

  const points: PointCarte[] = [];
  for (const o of offres ?? []) {
    if (o.latitude === null || o.longitude === null) continue;
    points.push({
      id: o.id,
      type: 'entraide_hebergement',
      titre: o.titre,
      slug: o.slug,
      latitude: o.latitude,
      longitude: o.longitude,
      sous_titre: o.lieu,
      href: `/s-entraider/offre/${o.slug}`,
    });
  }
  return points;
}

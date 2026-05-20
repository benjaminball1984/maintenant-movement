import { getSupabaseServer } from '@/lib/supabase';

/**
 * Couche de données de la carte unifiée (chantier 3.2).
 *
 * Spec §8A : « bases de données séparées par espace, agrégation à
 * l'affichage (pas une table monolithique) ». On agrège ici, au moment
 * de servir la page `/carte`, les sources géolocalisées disponibles.
 *
 * Pour 3.2 v1 : mobilisations + communes.
 * À enrichir au fil des chantiers : cagnottes locales (3.3), moments
 * solidaires (4.x), frigos solidaires (6.x), etc.
 */

export type TypePoint = 'mobilisation' | 'commune';

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

/**
 * Agrège tous les points géolocalisés pour la carte. Une seule fonction,
 * type union discriminé : facile à itérer côté carte client sans avoir
 * à charger N requêtes différentes.
 */
export async function chargerPointsCarte(): Promise<PointCarte[]> {
  const supabase = await getSupabaseServer();

  const [{ data: mobilisations }, { data: communes }] = await Promise.all([
    supabase
      .from('mobilisation')
      .select('id, titre, slug, latitude, longitude, lieu, date_debut')
      .eq('statut', 'publiee')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('date_debut', { ascending: true })
      .limit(500),
    supabase
      .from('commune')
      .select('id, nom, slug, latitude, longitude, departement')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(3000),
  ]);

  const points: PointCarte[] = [];

  for (const m of mobilisations ?? []) {
    // Garde-fou : Supabase peut renvoyer null malgré le filtre `is not null`
    // dans des cas exceptionnels (race condition). On filtre côté app.
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

  for (const c of communes ?? []) {
    if (c.latitude === null || c.longitude === null) continue;
    points.push({
      id: c.id,
      type: 'commune',
      titre: c.nom,
      slug: c.slug,
      latitude: c.latitude,
      longitude: c.longitude,
      sous_titre: c.departement,
      href: `/agir/communes/${c.slug}`,
    });
  }

  return points;
}

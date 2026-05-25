import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Renvoie le référentiel des communes (et arrondissements) géolocalisées au
 * format GeoJSON, pour alimenter la carte clusterisée (chantier 13.3-C).
 *
 * `commune_reference` est en lecture publique (RLS). On pagine par lots de
 * 1000 (limite PostgREST) pour récupérer les ~35 000 communes. La réponse est
 * volumineuse mais mise en cache : elle change rarement (référentiel INSEE).
 *
 * Les compteurs ne sont PAS inclus ici (anonymisés, calculés à la fiche) :
 * la carte n'a besoin que de la position et du nom pour le clustering.
 */
export const revalidate = 86_400; // 24 h : le référentiel bouge très peu.

const TAILLE_LOT = 1000;

interface FeatureCommune {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { code_insee: string; nom: string; type: string };
}

export async function GET() {
  const supabase = await getSupabaseServer();
  const features: FeatureCommune[] = [];

  for (let from = 0; ; from += TAILLE_LOT) {
    const { data, error } = await supabase
      .from('commune_reference')
      .select('code_insee, nom, type, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('code_insee', { ascending: true })
      .range(from, from + TAILLE_LOT - 1);

    if (error !== null) {
      return NextResponse.json({ error: 'Lecture du référentiel impossible.' }, { status: 500 });
    }
    if (data === null || data.length === 0) {
      break;
    }

    for (const commune of data) {
      if (commune.latitude === null || commune.longitude === null) continue;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [commune.longitude, commune.latitude] },
        properties: { code_insee: commune.code_insee, nom: commune.nom, type: commune.type },
      });
    }

    if (data.length < TAILLE_LOT) {
      break;
    }
  }

  return NextResponse.json(
    { type: 'FeatureCollection', features },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
  );
}

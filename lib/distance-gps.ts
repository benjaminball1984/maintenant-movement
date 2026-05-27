/**
 * Distance entre deux points GPS via la formule de Haversine (V2.4.53).
 *
 * Pure, testable, sans dépendance. Précision suffisante pour les
 * besoins de Maintenant! (filtrage cartographique « près de moi »,
 * tri par proximité de cagnottes / mobilisations / hébergements).
 *
 * Ignore l'altitude (assumée 0). Ne tient pas compte de l'ellipsoïde
 * WGS84 (sphère parfaite). Erreur typique : <0.5% pour des distances
 * <10 000 km.
 *
 * Unité de sortie : mètres.
 */

const RAYON_TERRE_METRES = 6_371_000;

export interface PointGps {
  latitude: number;
  longitude: number;
}

function radians(degres: number): number {
  return (degres * Math.PI) / 180;
}

/**
 * Distance entre deux points GPS en mètres.
 *
 * @example distanceMetres({latitude: 48.857, longitude: 2.351}, {latitude: 45.764, longitude: 4.836}) → ~392 km
 */
export function distanceMetres(a: PointGps, b: PointGps): number {
  const phi1 = radians(a.latitude);
  const phi2 = radians(b.latitude);
  const deltaPhi = radians(b.latitude - a.latitude);
  const deltaLambda = radians(b.longitude - a.longitude);

  const haversine =
    Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return RAYON_TERRE_METRES * c;
}

/**
 * Distance en km arrondie à 1 décimale pour l'affichage humain.
 *
 * @example distanceKmArrondie(395213) → 395.2
 */
export function distanceKmArrondie(a: PointGps, b: PointGps): number {
  return Math.round(distanceMetres(a, b) / 100) / 10;
}

/**
 * Format humain « 1,2 km », « 350 m » selon la magnitude.
 */
export function formaterDistance(a: PointGps, b: PointGps): string {
  const m = distanceMetres(a, b);
  if (m < 1000) return `${Math.round(m)} m`;
  const km = m / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`;
}

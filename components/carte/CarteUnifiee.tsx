'use client';

import type { PointCarte, TypePoint } from '@/lib/carte/donnees';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';

interface CarteUnifieeProps {
  points: PointCarte[];
}

const CENTRE_FRANCE: [number, number] = [2.3522, 46.7];
const ZOOM_INITIAL = 5;

/**
 * Couleur de marqueur par type (cohérent avec les Badge UI).
 *   - mobilisation : hue (signal politique)
 *   - commune : brand
 *
 * On utilise un cercle SVG inline car les marqueurs HTML par défaut
 * MapLibre sont une goutte d'eau bleue figée.
 *
 * Hexa en dur volontairement : MapLibre dessine ces cercles à l'exécution
 * dans des SVG isolés des tokens CSS, donc on ne peut pas y injecter une
 * variable Tailwind comme `bg-brand`. Si la palette dark mode change, il
 * faudra penser à dupliquer ce mapping derrière un `prefers-color-scheme`
 * (non nécessaire pour MVP : ces marqueurs sur fond OSM gardent un
 * contraste correct dans les deux thèmes).
 */
const COULEUR_PAR_TYPE: Record<TypePoint, string> = {
  mobilisation: '#e85d75',
  entraide_hebergement: '#10b981',
  entraide_transport: '#0ea5e9',
  entraide_pret_objet: '#f59e0b',
  entraide_fruits_terre: '#84cc16',
  sel: '#ec4899',
  produit_marche: '#6366f1',
  boutique_marche: '#a855f7',
  minimarche: '#d946ef',
  moment_solidaire: '#ef4444',
  sondage: '#0891b2',
  groupe_entraide: '#14b8a6',
};

const LIBELLE_PAR_TYPE: Record<TypePoint, string> = {
  mobilisation: 'Mobilisations',
  entraide_hebergement: 'Hébergement solidaire',
  entraide_transport: 'Transport solidaire',
  entraide_pret_objet: 'Qui prête tout',
  entraide_fruits_terre: 'Fruits de la terre',
  sel: 'SEL',
  produit_marche: 'Produits du marché',
  boutique_marche: 'Boutiques éphémères',
  minimarche: 'Minimarchés',
  moment_solidaire: 'Moments solidaires',
  sondage: 'Sondages locaux',
  groupe_entraide: 'Groupes d’entraide',
};

const TOUS_LES_TYPES: TypePoint[] = [
  'mobilisation',
  'entraide_hebergement',
  'entraide_transport',
  'entraide_pret_objet',
  'entraide_fruits_terre',
  'sel',
  'produit_marche',
  'boutique_marche',
  'minimarche',
  'moment_solidaire',
  'sondage',
  'groupe_entraide',
];

/**
 * Composant carte unifiée (Client Component). Reçoit les points pré-
 * agrégés côté serveur, monte une carte MapLibre, affiche les marqueurs
 * filtrables par type.
 *
 * Style : OSM raster public (libre, pas de clé requise). Pour la prod on
 * pourra basculer sur un style vectoriel libre (ex : OpenFreeMap) ou
 * self-hosted.
 */
/** Identifiant de la source GeoJSON clusterisée. */
const SOURCE = 'points';

/** Construit le GeoJSON des points filtrés par type actif. */
function versGeoJson(
  points: PointCarte[],
  typesActifs: Set<TypePoint>,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: points
      .filter((p) => typesActifs.has(p.type))
      .map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: {
          type: p.type,
          couleur: COULEUR_PAR_TYPE[p.type],
          libelle: LIBELLE_PAR_TYPE[p.type],
          titre: p.titre,
          sousTitre: p.sous_titre ?? '',
          href: p.href,
        },
      })),
  };
}

export function CarteUnifiee({ points }: CarteUnifieeProps) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<maplibregl.Map | null>(null);
  const [pret, setPret] = useState(false);
  const [typesActifs, setTypesActifs] = useState<Set<TypePoint>>(new Set(TOUS_LES_TYPES));

  // Initialisation MapLibre + clustering, une seule fois.
  useEffect(() => {
    if (conteneurRef.current === null) return;
    if (carteRef.current !== null) return;

    const carte = new maplibregl.Map({
      container: conteneurRef.current,
      style: {
        version: 8,
        // Glyphs nécessaires au compteur des clusters (symbol layer text).
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: CENTRE_FRANCE,
      zoom: ZOOM_INITIAL,
      attributionControl: false,
    });

    carte.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    carte.addControl(new maplibregl.AttributionControl({ compact: true }));

    carte.on('load', () => {
      // Source clusterisée : MapLibre regroupe les points proches/superposés
      // (lieux militants récurrents qui accueillent beaucoup d'événements).
      carte.addSource(SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 15,
      });

      // Cercle des clusters (taille croissante selon le nombre de points).
      carte.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#e85d75',
          'circle-opacity': 0.85,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 30],
        },
      });
      // Compteur au centre du cluster.
      carte.addLayer({
        id: 'clusters-count',
        type: 'symbol',
        source: SOURCE,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });
      // Points individuels (non regroupés), couleur selon le type.
      carte.addLayer({
        id: 'points-unite',
        type: 'circle',
        source: SOURCE,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'couleur'],
          'circle-radius': 7,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      // Clic sur un cluster : on zoome pour l'éclater.
      carte.on('click', 'clusters', (e) => {
        const f = carte.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        const clusterId = f?.properties?.cluster_id;
        const source = carte.getSource(SOURCE) as maplibregl.GeoJSONSource | undefined;
        if (clusterId === undefined || source === undefined) return;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geom = f?.geometry;
          if (geom?.type === 'Point') {
            carte.easeTo({ center: geom.coordinates as [number, number], zoom });
          }
        });
      });

      // Clic sur un point individuel : popup de la fiche.
      carte.on('click', 'points-unite', (e) => {
        const f = e.features?.[0];
        if (f === undefined || f.geometry.type !== 'Point') return;
        const p = f.properties ?? {};
        new maplibregl.Popup({ offset: 12, closeButton: false })
          .setLngLat(f.geometry.coordinates as [number, number])
          .setHTML(renduPopupProps(p))
          .addTo(carte);
      });

      for (const couche of ['clusters', 'points-unite']) {
        carte.on('mouseenter', couche, () => {
          carte.getCanvas().style.cursor = 'pointer';
        });
        carte.on('mouseleave', couche, () => {
          carte.getCanvas().style.cursor = '';
        });
      }

      setPret(true);
    });

    carteRef.current = carte;

    return () => {
      carte.remove();
      carteRef.current = null;
      setPret(false);
    };
  }, []);

  // Met à jour les données (donc les clusters) quand points/filtres changent.
  useEffect(() => {
    const carte = carteRef.current;
    if (carte === null || !pret) return;
    const source = carte.getSource(SOURCE) as maplibregl.GeoJSONSource | undefined;
    source?.setData(versGeoJson(points, typesActifs));
  }, [points, typesActifs, pret]);

  function basculer(type: TypePoint) {
    setTypesActifs((set) => {
      const copie = new Set(set);
      if (copie.has(type)) copie.delete(type);
      else copie.add(type);
      return copie;
    });
  }

  return (
    <div className="grid gap-3">
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="sr-only">Filtres de type</legend>
        {TOUS_LES_TYPES.map((type) => {
          const compte = points.filter((p) => p.type === type).length;
          return (
            <label
              key={type}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={typesActifs.has(type)}
                onChange={() => basculer(type)}
              />
              <span
                className="inline-block h-2.5 w-2.5 rounded-pill"
                style={{ background: COULEUR_PAR_TYPE[type] }}
                aria-hidden="true"
              />
              <span className="text-text-1">
                {LIBELLE_PAR_TYPE[type]} <span className="text-text-3">({compte})</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div
        ref={conteneurRef}
        className="h-[60vh] min-h-[400px] w-full overflow-hidden rounded-lg border border-border sm:h-[70vh]"
        aria-label="Carte interactive des actions Maintenant!"
        role="region"
      />
    </div>
  );
}

/**
 * Rendu HTML simple du contenu de popup. Pas de React ici : MapLibre
 * accepte une chaîne HTML. On échappe ce qui vient de l'utilisateur.
 *
 * Les styles inline consomment les CSS variables du site (`--text-1`,
 * `--text-2`, `--text-3`, `--brand`, `--surface`) pour rester lisibles
 * en mode clair comme en mode sombre, sans dépendre de Tailwind (le
 * popup est rendu dans un conteneur MapLibre hors du flux principal).
 */
function renduPopupProps(props: Record<string, unknown>): string {
  const libelle = echapperHtml(String(props.libelle ?? ''));
  const titre = echapperHtml(String(props.titre ?? ''));
  const sousTitre = echapperHtml(String(props.sousTitre ?? ''));
  const href = String(props.href ?? '#');
  return `
    <div style="font-family: var(--font-body, system-ui); min-width: 200px; background: var(--surface); color: var(--text-1);">
      <p style="margin: 0; font-size: 0.7rem; text-transform: uppercase; color: var(--text-3);">
        ${libelle}
      </p>
      <p style="margin: 0.25rem 0; font-weight: 700; color: var(--text-1);">${titre}</p>
      ${sousTitre !== '' ? `<p style="margin: 0; font-size: 0.85rem; color: var(--text-2);">${sousTitre}</p>` : ''}
      <a href="${echapperHtml(href)}" style="display: inline-block; margin-top: 0.5rem; color: var(--brand); text-decoration: underline;">
        Voir la fiche
      </a>
    </div>
  `;
}

function echapperHtml(brut: string): string {
  return brut
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

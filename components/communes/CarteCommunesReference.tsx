'use client';

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const CENTRE_FRANCE: [number, number] = [2.3522, 46.7];
const ZOOM_INITIAL = 5;

/** Source GeoJSON du référentiel (route API paginée, mise en cache). */
const URL_GEOJSON = '/api/communes/geojson';

/**
 * Carte clusterisée du référentiel des communes (chantier 13.3-C).
 *
 * ~35 000 communes : on s'appuie sur le clustering NATIF de MapLibre (source
 * GeoJSON `cluster: true`), bien plus performant que des marqueurs HTML
 * individuels (cf. note d'archi 6.1 : clusters au-delà de ~500 points).
 *
 * Interactions :
 *   - clic sur un cluster : zoom sur sa zone d'expansion ;
 *   - survol d'un cluster : popup avec le nombre de communes ;
 *   - clic sur une commune : navigation vers sa fiche `/communes/[code_insee]`.
 *
 * Pas de glyphes externes (le compte des clusters passe par un popup HTML) :
 * on évite d'ajouter un domaine à la CSP et une dépendance de police.
 */
export function CarteCommunesReference() {
  const router = useRouter();
  const conteneurRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (conteneurRef.current === null || carteRef.current !== null) return;

    const carte = new maplibregl.Map({
      container: conteneurRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          // CARTO Voyager via le CDN officiel actuel (basemaps.cartocdn.com).
          // L'ancien CDN Fastly (cartodb-basemaps-*.global.ssl.fastly.net)
          // est déprécié et retourne 404. Sub-domains a/b/c/d en round-robin.
          // Design doux adapté aux superpositions de points.
          carto: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
            maxzoom: 19,
          },
        },
        layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
      },
      center: CENTRE_FRANCE,
      zoom: ZOOM_INITIAL,
      attributionControl: false,
    });
    carte.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    carte.addControl(new maplibregl.AttributionControl({ compact: true }));
    carteRef.current = carte;

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

    carte.on('load', () => {
      carte.addSource('communes', {
        type: 'geojson',
        data: URL_GEOJSON,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 12,
      });

      // Clusters : cercle plus discret + nombre affiché à l'intérieur.
      // Tailles réduites (12/16/22 vs 16/22/30 avant) + transparence douce.
      // Couleurs : dégradé violet → magenta de la palette brand.
      carte.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'communes',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#a78bfa', // violet clair (< 100)
            100,
            '#8b5cf6', // violet (100-999)
            1000,
            '#7c3aed', // violet foncé (>= 1000)
          ],
          'circle-radius': ['step', ['get', 'point_count'], 12, 100, 16, 1000, 22],
          'circle-opacity': 0.78,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.95,
        },
      });

      // Label : nombre de communes au centre du cluster, blanc, gras.
      carte.addLayer({
        id: 'clusters-count',
        type: 'symbol',
        source: 'communes',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': ['step', ['get', 'point_count'], 11, 100, 12, 1000, 13],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Communes isolées : petit point cliquable plus discret.
      carte.addLayer({
        id: 'commune-point',
        type: 'circle',
        source: 'communes',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#a78bfa',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.85,
        },
      });

      // Clic sur un cluster : on zoome sur sa zone d'expansion.
      carte.on('click', 'clusters', (evenement) => {
        const elements = carte.queryRenderedFeatures(evenement.point, { layers: ['clusters'] });
        const clusterId = elements[0]?.properties?.cluster_id;
        const source = carte.getSource('communes') as maplibregl.GeoJSONSource | undefined;
        if (clusterId === undefined || source === undefined) return;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geometrie = elements[0]?.geometry;
          if (geometrie?.type === 'Point') {
            carte.easeTo({ center: geometrie.coordinates as [number, number], zoom });
          }
        });
      });

      // Clic sur une commune : navigation vers sa fiche.
      carte.on('click', 'commune-point', (evenement) => {
        const codeInsee = evenement.features?.[0]?.properties?.code_insee;
        if (typeof codeInsee === 'string') {
          router.push(`/communes/${codeInsee}`);
        }
      });

      // Survol d'un cluster : popup avec le nombre de communes.
      carte.on('mouseenter', 'clusters', (evenement) => {
        carte.getCanvas().style.cursor = 'pointer';
        const element = evenement.features?.[0];
        const nombre = element?.properties?.point_count_abbreviated;
        if (element?.geometry.type === 'Point' && nombre !== undefined) {
          popup
            .setLngLat(element.geometry.coordinates as [number, number])
            .setText(`${nombre} communes`)
            .addTo(carte);
        }
      });
      carte.on('mouseleave', 'clusters', () => {
        carte.getCanvas().style.cursor = '';
        popup.remove();
      });

      // Survol d'une commune : curseur main + nom.
      carte.on('mouseenter', 'commune-point', (evenement) => {
        carte.getCanvas().style.cursor = 'pointer';
        const element = evenement.features?.[0];
        const nom = element?.properties?.nom;
        if (element?.geometry.type === 'Point' && typeof nom === 'string') {
          popup
            .setLngLat(element.geometry.coordinates as [number, number])
            .setText(nom)
            .addTo(carte);
        }
      });
      carte.on('mouseleave', 'commune-point', () => {
        carte.getCanvas().style.cursor = '';
        popup.remove();
      });
    });

    return () => {
      carte.remove();
      carteRef.current = null;
    };
  }, [router]);

  return (
    <div
      ref={conteneurRef}
      className="h-[70vh] w-full overflow-hidden rounded-md border border-border"
      aria-label="Carte clusterisée des communes"
    />
  );
}

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
export function CarteUnifiee({ points }: CarteUnifieeProps) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<maplibregl.Map | null>(null);
  const marqueursRef = useRef<maplibregl.Marker[]>([]);
  const [typesActifs, setTypesActifs] = useState<Set<TypePoint>>(new Set(TOUS_LES_TYPES));

  // Initialisation MapLibre une seule fois.
  useEffect(() => {
    if (conteneurRef.current === null) return;
    if (carteRef.current !== null) return;

    const carte = new maplibregl.Map({
      container: conteneurRef.current,
      style: {
        version: 8,
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

    carteRef.current = carte;

    return () => {
      carte.remove();
      carteRef.current = null;
    };
  }, []);

  // Re-rendu des marqueurs quand `points` ou `typesActifs` changent.
  useEffect(() => {
    const carte = carteRef.current;
    if (carte === null) return;

    // Vide les marqueurs existants.
    for (const m of marqueursRef.current) {
      m.remove();
    }
    marqueursRef.current = [];

    for (const point of points) {
      if (!typesActifs.has(point.type)) continue;

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `${point.titre} (${LIBELLE_PAR_TYPE[point.type]})`);
      el.style.background = 'transparent';
      el.style.border = 'none';
      el.style.padding = '0';
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="7" fill="${COULEUR_PAR_TYPE[point.type]}" stroke="white" stroke-width="2"/>
        </svg>
      `;

      const popup = new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
        renduPopup(point),
      );

      const marqueur = new maplibregl.Marker({ element: el })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(popup)
        .addTo(carte);

      marqueursRef.current.push(marqueur);
    }
  }, [points, typesActifs]);

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
function renduPopup(point: PointCarte): string {
  const titre = echapperHtml(point.titre);
  const sousTitre = point.sous_titre !== null ? echapperHtml(point.sous_titre) : '';
  return `
    <div style="font-family: var(--font-body, system-ui); min-width: 200px; background: var(--surface); color: var(--text-1);">
      <p style="margin: 0; font-size: 0.7rem; text-transform: uppercase; color: var(--text-3);">
        ${echapperHtml(LIBELLE_PAR_TYPE[point.type])}
      </p>
      <p style="margin: 0.25rem 0; font-weight: 700; color: var(--text-1);">${titre}</p>
      ${sousTitre !== '' ? `<p style="margin: 0; font-size: 0.85rem; color: var(--text-2);">${sousTitre}</p>` : ''}
      <a href="${point.href}" style="display: inline-block; margin-top: 0.5rem; color: var(--brand); text-decoration: underline;">
        Voir la fiche →
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

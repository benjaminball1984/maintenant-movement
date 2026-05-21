'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface NotationEtoilesAffichageProps {
  /** Note entre 0 et 5, peut être fractionnaire (moyenne). */
  note: number | null;
  /** Nombre de notations (affiché en gris à droite). */
  nombre?: number;
  /** Taille en pixels d'une étoile. Défaut 16. */
  taille?: number;
  /** Inclut un libellé textuel accessible. */
  ariaLabel?: string;
}

/**
 * `<NotationEtoiles>` (lecture seule) — affiche une moyenne sur 5
 * étoiles avec un fill partiel pour la dernière étoile si fractionnaire.
 */
export function NotationEtoiles({
  note,
  nombre,
  taille = 16,
  ariaLabel,
}: NotationEtoilesAffichageProps) {
  if (note === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-text-3">
        <span aria-hidden>—</span>
        <span className="sr-only">Aucune notation pour l'instant</span>
      </span>
    );
  }
  const noteArrondie = Math.max(0, Math.min(5, note));
  const label = ariaLabel ?? `${noteArrondie.toFixed(2)} sur 5 étoiles`;
  return (
    <span className="inline-flex items-center gap-1" aria-label={label}>
      {[1, 2, 3, 4, 5].map((rang) => {
        const fill =
          noteArrondie >= rang ? 1 : noteArrondie > rang - 1 ? noteArrondie - (rang - 1) : 0;
        return <EtoileFillee key={rang} fill={fill} taille={taille} />;
      })}
      {nombre !== undefined && nombre > 0 ? (
        <span className="ml-1 text-xs text-text-3">({nombre})</span>
      ) : null}
    </span>
  );
}

function EtoileFillee({ fill, taille }: { fill: number; taille: number }) {
  const pourcentage = Math.round(fill * 100);
  return (
    <span className="relative inline-block" style={{ width: taille, height: taille }} aria-hidden>
      <Star size={taille} strokeWidth={1.5} className="absolute inset-0 text-text-3" />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pourcentage}%` }}>
        <Star size={taille} strokeWidth={1.5} fill="currentColor" className="text-warning" />
      </span>
    </span>
  );
}

// ============================================================
// Saisie : <SelectEtoiles>
// ============================================================

interface SelectEtoilesProps {
  /** Valeur sélectionnée (1 à 5) ou 0 pour « aucune ». */
  valeur: number;
  onChange: (n: number) => void;
  /** Identifiant accessible (lié au label parent). */
  idPrefixe?: string;
}

/**
 * `<SelectEtoiles>` — saisie des 5 étoiles. Utilise de vrais
 * `<input type="radio">` (un par valeur) cachés visuellement, et
 * délègue le rendu graphique aux labels. Pattern accessible :
 * navigable clavier (flèches gauche/droite), annoncé correctement
 * par les lecteurs d'écran (radiogroup natif).
 */
export function SelectEtoiles({ valeur, onChange, idPrefixe = 'etoile' }: SelectEtoilesProps) {
  const [survol, setSurvol] = useState<number>(0);
  const note = survol > 0 ? survol : valeur;
  const nomGroupe = `${idPrefixe}-radio`;

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">Note en étoiles</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const actif = note >= n;
          const id = `${idPrefixe}-${n}`;
          return (
            <label
              key={n}
              htmlFor={id}
              onMouseEnter={() => setSurvol(n)}
              onMouseLeave={() => setSurvol(0)}
              className="cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand"
            >
              <input
                type="radio"
                id={id}
                name={nomGroupe}
                value={n}
                checked={valeur === n}
                onChange={() => onChange(n)}
                onFocus={() => setSurvol(n)}
                onBlur={() => setSurvol(0)}
                className="sr-only"
                aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
              />
              <Star
                size={28}
                strokeWidth={1.5}
                fill={actif ? 'currentColor' : 'transparent'}
                className={actif ? 'text-warning' : 'text-text-3'}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

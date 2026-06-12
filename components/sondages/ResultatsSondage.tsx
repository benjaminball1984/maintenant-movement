'use client';

import { Card } from '@/components/ui';
import { useState } from 'react';

/** Libellés surchargeables admin via CMS (pattern V2.4.151). */
export interface LibellesResultatsSondage {
  vueBrute: string;
  vuePonderee: string;
  aideBrut: string;
  aidePondere: string;
  pondereIndisponible: string;
  legendeBascule: string;
}

const LIBELLES_DEFAUT: LibellesResultatsSondage = {
  vueBrute: 'Brut',
  vuePonderee: 'Pondéré',
  aideBrut: 'Votes tels qu’exprimés, sans redressement.',
  aidePondere:
    'Redressement par quotas sur la tranche d’âge déclarée (les votes sans tranche gardent un poids de 1).',
  pondereIndisponible:
    'La vue pondérée devient disponible dès 300 répondant·es ({total}/300 pour l’instant).',
  legendeBascule: 'Choisir la vue des résultats',
};

interface ResultatsSondageProps {
  options: string[];
  /** Tableau parallèle à `options` (null = option sans image), ou null. */
  optionsImages: (string | null)[] | null;
  resultatsBruts: number[];
  totalBrut: number;
  /** Compteurs pondérés (fractionnaires), null si indisponibles. */
  resultatsPonderes: number[] | null;
  totalPondere: number;
  /** Vrai dès 300 répondant·es : la vue pondérée devient la vue PAR DÉFAUT. */
  pondereDisponible: boolean;
  libelles?: LibellesResultatsSondage;
}

/**
 * Résultats d'un sondage avec bascule visiteur Brut / Pondéré (décision
 * Lilou/Ben 2026-06-12) : brut d'office sous le seuil de répondant·es,
 * pondéré d'office au-delà ; le visiteur choisit librement sa vue.
 */
export function ResultatsSondage({
  options,
  optionsImages,
  resultatsBruts,
  totalBrut,
  resultatsPonderes,
  totalPondere,
  pondereDisponible,
  libelles = LIBELLES_DEFAUT,
}: ResultatsSondageProps) {
  const [vue, setVue] = useState<'brut' | 'pondere'>(pondereDisponible ? 'pondere' : 'brut');

  const enPondere = vue === 'pondere' && resultatsPonderes !== null;
  const compteurs = enPondere ? (resultatsPonderes ?? resultatsBruts) : resultatsBruts;
  const total = enPondere ? totalPondere : totalBrut;

  return (
    <div className="grid gap-3">
      <fieldset>
        <legend className="sr-only">{libelles.legendeBascule}</legend>
        <div className="flex flex-wrap items-center gap-2">
          <BoutonVue
            actif={vue === 'brut'}
            libelle={libelles.vueBrute}
            onClick={() => setVue('brut')}
          />
          <BoutonVue
            actif={vue === 'pondere'}
            libelle={libelles.vuePonderee}
            onClick={() => setVue('pondere')}
            desactive={!pondereDisponible}
          />
        </div>
        <p className="mt-1 text-xs text-text-3" aria-live="polite">
          {pondereDisponible
            ? vue === 'pondere'
              ? libelles.aidePondere
              : libelles.aideBrut
            : libelles.pondereIndisponible.replace('{total}', String(totalBrut))}
        </p>
      </fieldset>

      <ul className="grid gap-2">
        {options.map((opt, index) => {
          const compte = compteurs[index] ?? 0;
          const pct = total === 0 ? 0 : Math.round((compte / total) * 100);
          const image = optionsImages?.[index] ?? null;
          return (
            <li key={`${index}-${opt}`}>
              <Card variant="ombre" className="grid gap-1">
                <div className="flex items-center gap-3">
                  {image !== null ? (
                    <img
                      src={image}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      className="h-12 w-12 shrink-0 rounded-sm border border-border object-cover"
                    />
                  ) : null}
                  <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                    <p className="font-bold text-text-1">{opt}</p>
                    <span className="shrink-0 text-sm text-text-3">
                      {enPondere ? `${pct}%` : `${compte} (${pct}%)`}
                    </span>
                  </div>
                </div>
                <progress
                  value={pct}
                  max={100}
                  className="h-2 w-full overflow-hidden rounded-pill bg-surface-2 [&::-webkit-progress-bar]:bg-surface-2 [&::-webkit-progress-value]:bg-grad-r [&::-moz-progress-bar]:bg-grad-r"
                  aria-label={`${opt} : ${pct}%`}
                />
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface BoutonVueProps {
  actif: boolean;
  libelle: string;
  onClick: () => void;
  desactive?: boolean;
}

function BoutonVue({ actif, libelle, onClick, desactive = false }: BoutonVueProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      aria-pressed={actif}
      className={`rounded-pill border px-4 py-1.5 text-sm font-bold transition-colors ${
        actif
          ? 'border-brand bg-brand text-white'
          : 'border-border bg-surface text-text-2 hover:bg-surface-2'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {libelle}
    </button>
  );
}

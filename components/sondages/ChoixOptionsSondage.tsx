'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';

/**
 * La liste des options d'un sondage, à cocher ou à pointer (V2.6.141).
 *
 * Extrait de `FormulaireVote` le jour où le vote sans compte est arrivé :
 * les deux formulaires doivent proposer EXACTEMENT la même urne (mêmes
 * cases, mêmes images, même absence de présélection). Un bulletin qui ne
 * se présente pas pareil selon la porte d'entrée fausserait le sondage.
 */
interface ChoixOptionsSondageProps {
  options: string[];
  /** Images des options (tableau parallèle, null = pas d'image), ou null. */
  optionsImages?: (string | null)[] | null;
  /** Choix multiple : cases à cocher plutôt que boutons radio. */
  choixMultiple: boolean;
  legende: string;
  /** Retour de `register('option_index')`, étalé sur chaque bouton radio. */
  radioProps: UseFormRegisterReturn;
  /** Index cochés, en choix multiple. */
  choisies: number[];
  onBasculer: (index: number) => void;
  messageErreur?: string;
}

export function ChoixOptionsSondage({
  options,
  optionsImages = null,
  choixMultiple,
  legende,
  radioProps,
  choisies,
  onBasculer,
  messageErreur,
}: ChoixOptionsSondageProps) {
  return (
    <fieldset>
      <legend className="mb-2 font-body text-sm font-medium text-text-2">
        {legende}
        {choixMultiple ? ' — plusieurs réponses possibles' : ''}
      </legend>
      <div className="grid gap-2">
        {options.map((opt, index) => {
          const image = optionsImages?.[index] ?? null;
          return (
            // biome-ignore lint/a11y/noLabelWithoutControl: l'input (radio ou case à cocher) est rendu dans la ternaire ci-dessous
            <label
              key={`${index}-${opt}`}
              className="flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
            >
              {/* Choix multiple : cases à cocher (état local → champ
                  `options_choisies`). Choix unique : boutons radio (pas de
                  `valueAsNumber`, qui renvoie NaN ; la conversion est faite
                  par le schéma Zod). */}
              {choixMultiple ? (
                <input
                  type="checkbox"
                  checked={choisies.includes(index)}
                  onChange={() => onBasculer(index)}
                  className="accent-brand"
                />
              ) : (
                <input type="radio" value={index} {...radioProps} className="accent-brand" />
              )}
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
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
      {!choixMultiple && messageErreur !== undefined ? (
        <p className="mt-1 text-xs text-danger">{messageErreur}</p>
      ) : null}
    </fieldset>
  );
}

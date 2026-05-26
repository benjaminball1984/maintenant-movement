'use client';

import { TeleverseurImage } from '@/components/ui/TeleverseurImage';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/**
 * Composant champ « Image de couverture » prêt à intégrer dans n'importe
 * quel formulaire de création / édition d'objet (cycle V2 V2.3.4).
 *
 * Encapsule `TeleverseurImage` (V2.0.3) + un champ caché `input[name]`
 * compatible `react-hook-form` (`<input {...register('image_url')} />`).
 * L'URL de l'image téléversée est synchronisée dans la valeur cachée.
 *
 * Articulation ET1 (image par défaut) ↔ ET2 (upload) :
 * - Si l'utilisateurice ne téléverse rien, le champ reste vide → côté
 *   backend `image_url` reste null → côté affichage la défaut prend le
 *   relais via `lib/images.ts:getImageObjet`.
 * - Si elle téléverse, l'URL absolue est stockée et remplace la défaut.
 *
 * Usage typique dans un formulaire react-hook-form :
 *   <ChampImageObjet
 *     name="image_url"
 *     valeurInitiale={defaultValues?.image_url}
 *     onChange={(url) => setValue('image_url', url ?? '')}
 *     role="couverture"
 *   />
 */

export interface ChampImageObjetProps {
  /** Nom HTML du champ caché (correspond au champ `image_url` du schéma Zod). */
  name: string;
  /** Valeur initiale (image déjà uploadée pour un objet existant). */
  valeurInitiale?: string | null;
  /** Préfixe Storage pour le rangement (ex. `petitions/<id>`). */
  prefixeChemin?: string;
  /**
   * Rôle de l'image (couverture / vignette / icône). Défaut : couverture.
   * Renommé `roleImage` (et non `role`) pour ne pas être confondu avec
   * l'attribut ARIA `role` par les outils de lint a11y.
   */
  roleImage?: 'couverture' | 'vignette' | 'icone';
  /** Callback : utile pour react-hook-form `setValue`. */
  onChange?: (url: string | null) => void;
  /** Libellé affiché. Défaut : « Image de couverture (optionnel) ». */
  libelle?: string;
  className?: string;
}

export function ChampImageObjet({
  name,
  valeurInitiale = null,
  prefixeChemin,
  roleImage = 'couverture',
  onChange,
  libelle = 'Image de couverture (optionnel)',
  className,
}: ChampImageObjetProps) {
  const [valeur, setValeur] = useState<string | null>(valeurInitiale ?? null);

  const surChange = (url: string | null) => {
    setValeur(url);
    onChange?.(url);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="font-medium text-sm text-text-1">{libelle}</span>
      <p className="-mt-1 text-text-3 text-xs">
        Sans téléversement, une image par défaut sera utilisée — ton objet ne sera jamais affiché
        sans image.
      </p>
      <TeleverseurImage
        role={roleImage}
        valeurInitiale={valeur}
        prefixeChemin={prefixeChemin}
        onChange={surChange}
      />
      {/*
        Champ caché synchronisé avec la valeur courante, pour que le
        formulaire HTML standard (ou react-hook-form via `register`)
        récupère l'URL téléversée à la soumission.
      */}
      <input type="hidden" name={name} value={valeur ?? ''} readOnly />
    </div>
  );
}

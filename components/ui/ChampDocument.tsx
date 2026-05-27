'use client';

import { televerserJustificatifAction } from '@/app/actions/justificatif';
import { cn } from '@/lib/utils';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * Composant champ « Document justificatif » (cycle V2 V2.3.32).
 *
 * Variante de `ChampImageObjet` pour les PDF + images. Réservé aux
 * usages admin (trésorerie : justificatif obligatoire D12bis). La
 * Server Action de téléversement vérifie le droit admin.
 *
 * À la sélection du fichier, appelle `televerserJustificatifAction`
 * qui retourne `cheminBucket` + métadonnées. Les valeurs sont posées
 * dans 4 inputs cachés pour synchronisation react-hook-form ou form
 * HTML standard :
 *   - `${name}_chemin` (storage path)
 *   - `${name}_nom_original`
 *   - `${name}_mime_type`
 *   - `${name}_taille`
 *
 * UX : bouton de sélection → spinner pendant l'upload → confirmation
 * verte avec nom du fichier + lien aperçu. Bouton « Retirer » remet
 * tout à zéro.
 */

const MIMES_ACCEPTES = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*';

export interface ChampDocumentProps {
  /** Préfixe des inputs cachés (ex. `justificatif`). */
  name: string;
  /** Préfixe Storage pour le rangement (ex. `transactions/{caisseId}`). */
  prefixeChemin?: string;
  /** Libellé affiché. */
  libelle?: string;
  /** Callback de synchronisation (utile pour react-hook-form). */
  onChange?: (
    valeur: {
      chemin: string;
      nomOriginal: string;
      mimeType: string;
      taille: number;
    } | null,
  ) => void;
  className?: string;
}

export function ChampDocument({
  name,
  prefixeChemin,
  libelle = 'Justificatif (PDF, JPEG, PNG ou WebP, 10 Mo max)',
  onChange,
  className,
}: ChampDocumentProps) {
  const refInput = useRef<HTMLInputElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<{
    chemin: string;
    urlSignee: string;
    nomOriginal: string;
    mimeType: string;
    taille: number;
  } | null>(null);

  const surFichier = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = event.target.files?.[0];
    if (fichier === undefined) return;

    setEnCours(true);
    setErreur(null);
    setResultat(null);

    const formData = new FormData();
    formData.append('fichier', fichier);
    if (prefixeChemin !== undefined) formData.append('prefixe', prefixeChemin);

    const r = await televerserJustificatifAction(formData);
    setEnCours(false);

    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setResultat({
      chemin: r.cheminBucket,
      urlSignee: r.urlSignee,
      nomOriginal: r.nomOriginal,
      mimeType: r.mimeType,
      taille: r.taille,
    });
    onChange?.({
      chemin: r.cheminBucket,
      nomOriginal: r.nomOriginal,
      mimeType: r.mimeType,
      taille: r.taille,
    });
  };

  const surRetirer = () => {
    setResultat(null);
    setErreur(null);
    if (refInput.current !== null) refInput.current.value = '';
    onChange?.(null);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="font-medium text-sm text-text-1">{libelle}</span>

      {resultat === null ? (
        <label
          className={cn(
            'flex cursor-pointer items-center justify-center gap-2',
            'rounded-md border border-border border-dashed bg-surface p-4',
            'text-sm text-text-2 transition-colors hover:bg-surface-2',
            enCours && 'pointer-events-none opacity-50',
          )}
        >
          <Upload size={16} aria-hidden="true" />
          <span>{enCours ? 'Téléversement…' : 'Choisir un fichier'}</span>
          <input
            ref={refInput}
            type="file"
            accept={MIMES_ACCEPTES}
            className="sr-only"
            onChange={surFichier}
            disabled={enCours}
          />
        </label>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-success bg-success-light p-3">
          <CheckCircle2 size={20} className="text-success" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm text-text-1">
              <FileText size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
              {resultat.nomOriginal}
            </p>
            <p className="text-text-3 text-xs">
              {resultat.mimeType} · {formaterTaille(resultat.taille)} ·{' '}
              <a
                href={resultat.urlSignee}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                aperçu
              </a>
            </p>
          </div>
          <button
            type="button"
            onClick={surRetirer}
            aria-label="Retirer le fichier"
            className="text-text-3 hover:text-danger"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}

      {/* Inputs cachés pour la synchronisation form. */}
      <input type="hidden" name={`${name}_chemin`} value={resultat?.chemin ?? ''} readOnly />
      <input
        type="hidden"
        name={`${name}_nom_original`}
        value={resultat?.nomOriginal ?? ''}
        readOnly
      />
      <input type="hidden" name={`${name}_mime_type`} value={resultat?.mimeType ?? ''} readOnly />
      <input type="hidden" name={`${name}_taille`} value={resultat?.taille ?? 0} readOnly />
    </div>
  );
}

function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

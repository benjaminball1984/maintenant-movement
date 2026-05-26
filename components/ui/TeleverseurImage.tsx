'use client';

import { televerserImage } from '@/app/actions/storage';
import { MIME_AUTORISES, type RoleImage, TAILLE_MAX_OCTETS } from '@/lib/storage/types';
import { cn } from '@/lib/utils';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { type ChangeEvent, useCallback, useId, useRef, useState } from 'react';

/**
 * Composant unique de téléversement d'image (exigence transversale ET2 du
 * cycle V2, `docs/cdc-v2/01b-EXIGENCES-TRANSVERSALES-UI.md`).
 *
 * Règle d'or articulée avec ET1 : *l'image par défaut est le filet de
 * sécurité visuel permanent ; l'upload est le remplacement volontaire. Si
 * la personne téléverse, son image remplace la défaut. Sinon la défaut
 * reste. Jamais d'objet sans image, jamais d'obligation d'uploader.*
 *
 * Conséquence : ce composant est **toujours optionnel** dans un formulaire.
 * Il n'invalide jamais la soumission s'il est vide.
 *
 * UX :
 *
 * - Bouton « Téléverser une image » bien visible. **Pas de champ URL.**
 * - Aperçu de l'image actuelle (uploadée ou défaut), changeable, supprimable.
 * - Pendant l'upload : indicateur de chargement, bouton désactivé.
 * - Erreur de validation : message visible sous le bouton.
 *
 * Validation côté client (première ligne) : type MIME, taille max. Côté
 * serveur (deuxième ligne) : mêmes règles dans la Server Action +
 * restrictions du bucket Supabase Storage.
 */

export interface TeleverseurImageProps {
  /**
   * Rôle de l'image : influence la sémantique et (côté Supabase) le rangement
   * dans le bucket.
   */
  role: RoleImage;

  /**
   * URL initialement affichée (par exemple l'image déjà associée à l'objet,
   * ou l'image par défaut si l'objet est nouveau). Si vide, le composant
   * affiche un cadre vide cliquable.
   */
  valeurInitiale?: string | null;

  /**
   * Préfixe optionnel passé à l'adapter pour organiser le rangement dans
   * le bucket. Exemple : `'petitions/<id>'`.
   */
  prefixeChemin?: string;

  /**
   * Appelé après une mise à jour réussie (téléversement ou suppression).
   * - Téléversement réussi : `(url, cheminBucket)`.
   * - Suppression : `(null, null)`.
   */
  onChange?: (url: string | null, cheminBucket: string | null) => void;

  /**
   * Étiquette du bouton de téléversement. Par défaut : « Téléverser une image ».
   */
  libelle?: string;

  /**
   * `name` du champ caché qui porte la valeur, si on intègre dans un
   * formulaire HTML standard. Permet à la Server Action parente de
   * récupérer la valeur sans `onChange`.
   */
  name?: string;

  className?: string;
}

interface EtatComposant {
  url: string | null;
  cheminBucket: string | null;
  enCours: boolean;
  erreur: string | null;
}

/** Helper formatage taille pour les messages d'erreur. */
function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function TeleverseurImage({
  role,
  valeurInitiale = null,
  prefixeChemin,
  onChange,
  libelle = 'Téléverser une image',
  name,
  className,
}: TeleverseurImageProps) {
  const idInput = useId();
  const refInput = useRef<HTMLInputElement>(null);
  const [etat, setEtat] = useState<EtatComposant>({
    url: valeurInitiale ?? null,
    cheminBucket: null,
    enCours: false,
    erreur: null,
  });

  /** Validation côté client AVANT envoi (UX : feedback instantané). */
  const validerCote = useCallback((fichier: File): string | null => {
    if (!MIME_AUTORISES.includes(fichier.type as (typeof MIME_AUTORISES)[number])) {
      return `Format non supporté (${fichier.type || 'inconnu'}). Formats acceptés : JPEG, PNG, WebP.`;
    }
    if (fichier.size > TAILLE_MAX_OCTETS) {
      return `Fichier trop volumineux (${formaterTaille(fichier.size)}). Maximum : ${formaterTaille(TAILLE_MAX_OCTETS)}.`;
    }
    return null;
  }, []);

  const surChangementFichier = useCallback(
    async (evenement: ChangeEvent<HTMLInputElement>) => {
      const fichier = evenement.target.files?.[0];
      if (fichier === undefined) return;

      const erreurValidation = validerCote(fichier);
      if (erreurValidation !== null) {
        setEtat((prec) => ({ ...prec, erreur: erreurValidation }));
        // Reset l'input pour permettre de re-sélectionner le même fichier corrigé.
        if (refInput.current) refInput.current.value = '';
        return;
      }

      setEtat((prec) => ({ ...prec, enCours: true, erreur: null }));

      const formData = new FormData();
      formData.append('fichier', fichier);
      formData.append('role', role);
      if (prefixeChemin !== undefined) formData.append('prefixeChemin', prefixeChemin);

      try {
        const resultat = await televerserImage(formData);
        if (resultat.ok) {
          setEtat({
            url: resultat.url,
            cheminBucket: resultat.cheminBucket,
            enCours: false,
            erreur: null,
          });
          onChange?.(resultat.url, resultat.cheminBucket);
        } else {
          setEtat((prec) => ({ ...prec, enCours: false, erreur: resultat.message }));
        }
      } catch (_erreur) {
        setEtat((prec) => ({
          ...prec,
          enCours: false,
          erreur: 'Téléversement impossible. Réessaie dans un instant.',
        }));
      } finally {
        if (refInput.current) refInput.current.value = '';
      }
    },
    [role, prefixeChemin, onChange, validerCote],
  );

  const surSuppression = useCallback(() => {
    setEtat({ url: null, cheminBucket: null, enCours: false, erreur: null });
    onChange?.(null, null);
  }, [onChange]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {etat.url !== null && (
        <div className="relative inline-block overflow-hidden rounded-md border border-border bg-surface-2">
          {/* Aperçu local sans next/image : peut être un data URL (mock storage). */}
          <img
            src={etat.url}
            alt="Aperçu de l'image téléversée"
            className="max-h-48 w-auto object-contain"
          />
          <button
            type="button"
            onClick={surSuppression}
            disabled={etat.enCours}
            aria-label="Retirer l'image téléversée et revenir à l'image par défaut"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-text-1 shadow-sm transition hover:bg-surface disabled:opacity-50"
          >
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label
          htmlFor={idInput}
          className={cn(
            'inline-flex h-11 cursor-pointer items-center gap-2 rounded-md',
            'border border-border bg-surface px-4 text-sm font-medium text-text-1',
            'transition hover:bg-surface-2 active:scale-[0.97]',
            etat.enCours && 'pointer-events-none opacity-60',
          )}
        >
          {etat.enCours ? (
            <>
              <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
              <span>Téléversement…</span>
            </>
          ) : (
            <>
              <ImagePlus size={18} strokeWidth={1.5} aria-hidden="true" />
              <span>{etat.url === null ? libelle : 'Remplacer l’image'}</span>
            </>
          )}
        </label>
        <input
          ref={refInput}
          id={idInput}
          type="file"
          accept={MIME_AUTORISES.join(',')}
          onChange={surChangementFichier}
          disabled={etat.enCours}
          className="sr-only"
        />
        {name !== undefined && <input type="hidden" name={name} value={etat.url ?? ''} />}
      </div>

      {etat.erreur !== null && (
        <p role="alert" className="text-sm text-danger">
          {etat.erreur}
        </p>
      )}

      <p className="text-xs text-text-3">
        JPEG, PNG ou WebP. Maximum {formaterTaille(TAILLE_MAX_OCTETS)}. Sans téléversement, une
        image par défaut est utilisée.
      </p>
    </div>
  );
}

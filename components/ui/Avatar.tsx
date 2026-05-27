import { avatarHsl, initialesPourAvatar } from '@/lib/avatar-couleur';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/**
 * Composant Avatar universel (V2.4.80).
 *
 * Affiche soit la photo de la personne (si `photoUrl` fournie et non
 * vide), soit un avatar généré : cercle de couleur déterministe HSL
 * basée sur l'identifiant + initiales du nom complet.
 *
 * Server Component sans état. Le hash FNV-1a (lib/hash.ts) garantit
 * une couleur stable pour un même identifiant à travers les sessions.
 *
 * 3 tailles : sm (32px), md (48px), lg (64px).
 */

export type TailleAvatar = 'sm' | 'md' | 'lg';

const TAILLE_PX: Record<TailleAvatar, number> = {
  sm: 32,
  md: 48,
  lg: 64,
};

const TAILLE_TEXTE: Record<TailleAvatar, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export interface AvatarProps {
  /** Identifiant stable (UUID, email, numéro M+7) pour la couleur de l'avatar généré. */
  id: string;
  /** Nom complet pour les initiales (ignoré si `photoUrl` fournie). */
  nomComplet: string;
  /** URL d'une photo, optionnelle. Si fournie et non vide, remplace les initiales. */
  photoUrl?: string | null;
  /** Taille du cercle. Défaut `md` (48px). */
  taille?: TailleAvatar;
  className?: string;
}

export function Avatar({ id, nomComplet, photoUrl, taille = 'md', className }: AvatarProps) {
  const tailleNum = TAILLE_PX[taille];
  const classNameBase = cn('relative shrink-0 overflow-hidden rounded-full', className);

  if (photoUrl !== null && photoUrl !== undefined && photoUrl.trim() !== '') {
    return (
      <div
        className={classNameBase}
        style={{ width: tailleNum, height: tailleNum }}
        aria-label={nomComplet}
      >
        <Image
          src={photoUrl}
          alt={nomComplet}
          fill
          unoptimized
          sizes={`${tailleNum}px`}
          className="object-cover"
        />
      </div>
    );
  }

  const couleur = avatarHsl(id);
  const initiales = initialesPourAvatar(nomComplet);

  return (
    <div
      className={cn(
        classNameBase,
        'flex items-center justify-center font-bold text-white',
        TAILLE_TEXTE[taille],
      )}
      style={{
        width: tailleNum,
        height: tailleNum,
        backgroundColor: couleur,
      }}
      aria-label={nomComplet}
      role="img"
    >
      <span aria-hidden="true">{initiales}</span>
    </div>
  );
}

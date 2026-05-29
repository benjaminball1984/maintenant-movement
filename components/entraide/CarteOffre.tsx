import { Badge } from '@/components/ui';
import type { OffreEnrichie } from '@/lib/entraide/requetes';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CarteOffreProps {
  offre: OffreEnrichie;
  enAvant?: boolean;
}

/**
 * Image par défaut par type d'offre. Les fichiers existent déjà dans
 * `public/defaults/`. On retombe sur l'offre-entraide générique pour
 * les types non spécifiquement illustrés (qui-prête-tout, fruits-de-la-terre).
 */
const IMAGE_DEFAUT_PAR_TYPE: Record<string, string> = {
  transport: '/defaults/offre-entraide.svg',
  hebergement: '/defaults/offre-entraide.svg',
  pret_objet: '/defaults/offre-entraide.svg',
  fruits_terre: '/defaults/offre-entraide.svg',
};

/**
 * `<CarteOffre>` — vignette d'annonce d'entraide (V2.5.12).
 *
 * Refonte « grammaire visuelle des leaders grand public » (Master Plan
 * V2.6 Phase I §3.5). Vinted-like pour le marché, BlaBlaCar-like pour
 * le transport, Airbnb-like pour l'hébergement : on emprunte la grille
 * de vignettes + photo carrée + badge en surimpression, sans inventer
 * d'iconographie spécifique.
 *
 * Utilisée par 4 sous-espaces qui partagent `<PageListeSousEspace>` :
 * hébergement, transport, fruits-de-la-terre, qui-prête-tout. Le SEL
 * a son propre composant. La carte ne dépend que de `OffreEnrichie`,
 * elle est purement présentation.
 */
export function CarteOffre({ offre, enAvant = false }: CarteOffreProps) {
  const lien = `/s-entraider/offre/${offre.slug}`;
  const imageSrc =
    offre.image_url !== null && offre.image_url.trim() !== ''
      ? offre.image_url
      : (IMAGE_DEFAUT_PAR_TYPE[offre.type] ?? '/defaults/offre-entraide.svg');

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-surface transition',
        'hover:border-brand hover:shadow-md',
        enAvant ? 'border-info/50 shadow-info/20 shadow-md' : 'border-border',
      )}
    >
      {/* Photo carrée en hero. */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
        <Image
          src={imageSrc}
          alt={offre.titre}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-fast group-hover:scale-[1.03]"
        />
        {/* Badge sens en surimpression haut-gauche. */}
        <div className="absolute top-2 left-2">
          <Badge variant={offre.sens === 'propose' ? 'success' : 'info'}>
            {offre.sens === 'propose' ? 'Offre' : 'Demande'}
          </Badge>
        </div>
      </div>

      {/* Bloc texte sous la photo. */}
      <div className="flex flex-col gap-2 p-3">
        <h3 className="line-clamp-2 font-bold text-sm leading-snug text-text-1">
          <Link href={lien} className="hover:text-brand">
            {/* Overlay invisible qui rend toute la carte cliquable. */}
            <span aria-hidden="true" className="absolute inset-0" />
            {offre.titre}
          </Link>
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-text-3">
          <MapPin size={12} strokeWidth={1.5} />
          <span className="line-clamp-1">{offre.lieu}</span>
        </div>

        <p className="line-clamp-3 text-xs text-text-2 leading-relaxed">{offre.description}</p>
      </div>
    </article>
  );
}

import { DoubleAffichagePrix } from '@/components/marche/BadgesMonnaies';
import { NotationEtoiles } from '@/components/marche/NotationEtoiles';
import { Badge } from '@/components/ui';
import type { ProduitMarcheEnrichi } from '@/lib/marche/requetes';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CarteProduitProps {
  produit: ProduitMarcheEnrichi;
  enAvant?: boolean;
}

/**
 * `<CarteProduit>` — vignette d'annonce du marché solidaire (V2.5.11).
 *
 * Refonte « façon Vinted » (Master Plan V2.6 Phase I §3.5) :
 *   - Photo carrée en haut (aspect-square, object-cover), c'est le hero
 *     de la vignette ; image par défaut `/defaults/offre-marche.svg`
 *     si l'annonce n'a pas encore de photo.
 *   - Badges (mode vente/don, statut) en surimpression sur la photo
 *     en haut à gauche, à la Vinted.
 *   - Sous la photo : prix grand et lisible, titre compact (1-2 lignes
 *     max), puis lieu et vendeureuse (avec note) en pied.
 *   - Pas de description longue dans la vignette : on la garde pour la
 *     page détail.
 *   - Carte cliquable dans son ensemble via un overlay invisible.
 */
export function CarteProduit({ produit, enAvant = false }: CarteProduitProps) {
  const lien = `/s-entraider/marche/produits/${produit.slug}`;
  const imageSrc =
    produit.image_url !== null && produit.image_url.trim() !== ''
      ? produit.image_url
      : '/defaults/offre-marche.svg';

  const vendeureuseNom =
    produit.vendeureuse_prenom !== null || produit.vendeureuse_nom !== null
      ? [produit.vendeureuse_prenom, produit.vendeureuse_nom]
          .filter((s) => s !== null && s.trim() !== '')
          .join(' ')
      : 'Vendeureuse';

  const libelleStatut: Record<string, string> = {
    reserve: 'Réservé',
    vendu: 'Vendu',
    retire: 'Retiré',
    expire: 'Expiré',
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-surface transition',
        'hover:border-brand hover:shadow-md',
        enAvant ? 'border-brand/50 shadow-brand/20 shadow-md' : 'border-border',
      )}
    >
      {/* Photo carrée en hero. */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
        <Image
          src={imageSrc}
          alt={produit.titre}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-fast group-hover:scale-[1.03]"
        />
        {/* Badges en surimpression haut-gauche. */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          <Badge variant={produit.mode === 'don' ? 'success' : 'brand'}>
            {produit.mode === 'don' ? 'Don' : 'Vente'}
          </Badge>
          {produit.statut !== 'disponible' ? (
            <Badge variant="default">{libelleStatut[produit.statut] ?? produit.statut}</Badge>
          ) : null}
        </div>
      </div>

      {/* Bloc texte sous la photo. */}
      <div className="flex flex-col gap-2 p-3">
        <div className="font-bold text-base">
          <DoubleAffichagePrix
            mode={produit.mode}
            prixEurosCentimes={produit.prix_euros_centimes}
            prixT99CPUnites={produit.prix_t99cp_unites}
          />
        </div>

        <h3 className="line-clamp-2 text-sm leading-snug text-text-1">
          <Link href={lien} className="hover:text-brand">
            {/* Overlay invisible qui rend toute la carte cliquable. */}
            <span aria-hidden="true" className="absolute inset-0" />
            {produit.titre}
          </Link>
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-text-3">
          <MapPin size={12} strokeWidth={1.5} />
          <span className="line-clamp-1">{produit.lieu}</span>
        </div>

        <footer className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-2 text-xs">
          <span className="line-clamp-1 text-text-3">{vendeureuseNom}</span>
          <NotationEtoiles
            note={produit.moyenne_etoiles}
            nombre={produit.nombre_notations}
            taille={11}
          />
        </footer>
      </div>
    </article>
  );
}

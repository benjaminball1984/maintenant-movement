import { DoubleAffichagePrix } from '@/components/marche/BadgesMonnaies';
import { NotationEtoiles } from '@/components/marche/NotationEtoiles';
import { Badge, Card } from '@/components/ui';
import type { ProduitMarcheEnrichi } from '@/lib/marche/requetes';
import { cn } from '@/lib/utils';
import { MapPin, Package, Truck } from 'lucide-react';
import Link from 'next/link';

interface CarteProduitProps {
  produit: ProduitMarcheEnrichi;
  enAvant?: boolean;
}

/**
 * `<CarteProduit>` — vignette d'annonce du marché solidaire.
 *
 * Affiche : badge mode (vente/don), titre, double prix (EUR / T99CP),
 * lieu, modes de retrait, et la note moyenne de la vendeureuse.
 */
export function CarteProduit({ produit, enAvant = false }: CarteProduitProps) {
  const accroche =
    produit.description.length > 180
      ? `${produit.description.slice(0, 180).trimEnd()}...`
      : produit.description;

  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-3', enAvant && 'border-brand/40')}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={produit.mode === 'don' ? 'success' : 'brand'}>
          {produit.mode === 'don' ? 'Don' : 'Vente'}
        </Badge>
        {produit.statut !== 'disponible' ? (
          <Badge variant="default">
            {{
              reserve: 'Réservé',
              vendu: 'Vendu',
              retire: 'Retiré',
              expire: 'Expiré',
            }[produit.statut] ?? produit.statut}
          </Badge>
        ) : null}
      </header>

      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/s-entraider/marche/produits/${produit.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {produit.titre}
        </Link>
      </h3>

      <DoubleAffichagePrix
        mode={produit.mode}
        prixEurosCentimes={produit.prix_euros_centimes}
        prixT99CPUnites={produit.prix_t99cp_unites}
      />

      <p className="text-sm text-text-2">{accroche}</p>

      <dl className="grid gap-1 text-sm text-text-2">
        <div className="flex items-start gap-2">
          <MapPin size={14} strokeWidth={1.5} className="mt-0.5 text-text-3" />
          <dd>{produit.lieu}</dd>
        </div>
        <div className="flex items-start gap-2 text-text-3">
          {produit.remise_main_propre ? (
            <span className="inline-flex items-center gap-1">
              <Package size={14} strokeWidth={1.5} />
              <span>Main propre</span>
            </span>
          ) : null}
          {produit.envoi_postal ? (
            <span className="inline-flex items-center gap-1">
              <Truck size={14} strokeWidth={1.5} />
              <span>Envoi postal</span>
            </span>
          ) : null}
        </div>
      </dl>

      <footer className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs text-text-3">
        <span>
          {produit.vendeureuse_prenom !== null || produit.vendeureuse_nom !== null
            ? [produit.vendeureuse_prenom, produit.vendeureuse_nom]
                .filter((s) => s !== null && s.trim() !== '')
                .join(' ')
            : 'Vendeureuse'}
        </span>
        <NotationEtoiles
          note={produit.moyenne_etoiles}
          nombre={produit.nombre_notations}
          taille={12}
        />
      </footer>
    </Card>
  );
}

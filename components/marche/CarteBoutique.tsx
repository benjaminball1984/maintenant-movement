import { Badge, Card } from '@/components/ui';
import type { BoutiqueMarcheEnrichie } from '@/lib/marche/requetes';
import { cn } from '@/lib/utils';
import { CalendarRange, MapPin, Store } from 'lucide-react';
import Link from 'next/link';

interface CarteBoutiqueProps {
  boutique: BoutiqueMarcheEnrichie;
  enAvant?: boolean;
}

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
});

function formaterPlage(du: string | null, au: string | null): string | null {
  if (du === null && au === null) return null;
  if (du !== null && au !== null) {
    return `${FORMATEUR_DATE.format(new Date(du))} → ${FORMATEUR_DATE.format(new Date(au))}`;
  }
  return du !== null ? `À partir du ${FORMATEUR_DATE.format(new Date(du))}` : null;
}

/**
 * `<CarteBoutique>` — vignette d'une boutique éphémère.
 */
export function CarteBoutique({ boutique, enAvant = false }: CarteBoutiqueProps) {
  const plage = formaterPlage(boutique.ouverte_du, boutique.ouverte_au);
  const accroche =
    boutique.description.length > 180
      ? `${boutique.description.slice(0, 180).trimEnd()}...`
      : boutique.description;
  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-3', enAvant && 'border-accent/40')}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={boutique.sens === 'propose' ? 'brand' : 'info'}>
          {boutique.sens === 'propose' ? 'Boutique' : 'Cherche à co-créer'}
        </Badge>
        <span className="text-xs text-text-3">
          {boutique.nombre_produits} produit{boutique.nombre_produits > 1 ? 's' : ''}
        </span>
      </header>

      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/s-entraider/marche/boutiques/${boutique.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {boutique.nom}
        </Link>
      </h3>

      <p className="text-sm text-text-2">{accroche}</p>

      <dl className="grid gap-1 text-sm text-text-2">
        {boutique.lieu !== null && boutique.lieu.trim() !== '' ? (
          <div className="flex items-start gap-2">
            <MapPin size={14} strokeWidth={1.5} className="mt-0.5 text-text-3" aria-hidden="true" />
            <dd>{boutique.lieu}</dd>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-text-3">
            <Store size={14} strokeWidth={1.5} className="mt-0.5" aria-hidden="true" />
            <dd>Boutique en ligne uniquement</dd>
          </div>
        )}
        {plage !== null ? (
          <div className="flex items-start gap-2">
            <CalendarRange
              size={14}
              strokeWidth={1.5}
              className="mt-0.5 text-text-3"
              aria-hidden="true"
            />
            <dd>{plage}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}

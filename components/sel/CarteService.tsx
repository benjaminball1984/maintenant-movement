import { Badge } from '@/components/ui';
import type { ServiceSelEnrichi } from '@/lib/sel/requetes';
import { cn } from '@/lib/utils';
import { MapPin, User } from 'lucide-react';
import Link from 'next/link';

interface CarteServiceProps {
  service: ServiceSelEnrichi;
  enAvant?: boolean;
}

/**
 * `<CarteService>` — vignette d'un service ou volontariat SEL (V2.5.12).
 *
 * Le SEL n'a pas de photo associée à un service (c'est du temps + une
 * compétence). On transpose donc la « grammaire visuelle des leaders »
 * sans photo, en mettant la VALEUR centrale (durée + 99-coin attendus)
 * en avant typographiquement, comme un prix sur Vinted ou un tarif horaire.
 *
 * Carte plus haute qu'large, dense en information, cliquable en entier.
 */
export function CarteService({ service, enAvant = false }: CarteServiceProps) {
  const lien = `/s-entraider/sel/${service.slug}`;
  const auteurNom =
    service.createurice_prenom !== null || service.createurice_nom !== null
      ? [service.createurice_prenom, service.createurice_nom]
          .filter((s) => s !== null && s.trim() !== '')
          .join(' ')
      : 'Anonyme';

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-surface p-4 transition',
        'hover:border-brand hover:shadow-md',
        enAvant ? 'border-brand/50 shadow-brand/20 shadow-md' : 'border-border',
      )}
    >
      {/* Badges en haut. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Badge variant={service.categorie === 'service' ? 'brand' : 'accent'}>
          {service.categorie === 'service' ? 'Service' : 'Volontariat'}
        </Badge>
        <Badge variant={service.sens === 'propose' ? 'success' : 'info'}>
          {service.sens === 'propose' ? 'Offre' : 'Demande'}
        </Badge>
      </div>

      {/* Hero typographique : la VALEUR du service en gros. */}
      <div className="mb-4 grid gap-1 rounded-md bg-surface-2 p-3 text-center">
        <p className="font-display text-2xl font-extrabold text-text-1">
          {service.duree_minutes_estimee} min
        </p>
        <p className="font-bold text-sm text-brand">
          {service.duree_minutes_estimee} 99-coin attendus
        </p>
      </div>

      <h3 className="mb-2 line-clamp-2 font-bold text-base leading-snug text-text-1">
        <Link href={lien} className="hover:text-brand">
          {/* Overlay invisible qui rend toute la carte cliquable. */}
          <span aria-hidden="true" className="absolute inset-0" />
          {service.titre}
        </Link>
      </h3>

      <p className="mb-3 line-clamp-3 text-xs text-text-2 leading-relaxed">{service.description}</p>

      <footer className="mt-auto grid gap-1 border-t border-border pt-2 text-xs text-text-3">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} strokeWidth={1.5} />
          <span className="line-clamp-1">{service.lieu}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={12} strokeWidth={1.5} />
          <span className="line-clamp-1">{auteurNom}</span>
        </div>
      </footer>
    </article>
  );
}

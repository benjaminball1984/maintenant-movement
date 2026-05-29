import { Badge } from '@/components/ui';
import type { OffreEnrichie } from '@/lib/entraide/requetes';
import { cn } from '@/lib/utils';
import { ArrowRight, Calendar, Clock, MapPin, Users } from 'lucide-react';
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
 * Extrait sûrement une chaîne d'un objet JSONB inconnu. Utile pour lire
 * `offre.meta` (typé Json) sans casser le typage strict.
 */
function lireMeta(meta: unknown, cle: string): string | null {
  if (meta === null || typeof meta !== 'object') return null;
  const v = (meta as Record<string, unknown>)[cle];
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}

/**
 * `<CarteOffre>` — vignette d'annonce d'entraide (V2.5.12).
 *
 * Refonte « grammaire visuelle des leaders grand public » (Master Plan
 * V2.6 Phase I §3.5). Vinted-like pour le marché, BlaBlaCar-like pour
 * le transport, Airbnb-like pour l'hébergement : on emprunte la grille
 * de vignettes + photo carrée + badge en surimpression, sans inventer
 * d'iconographie spécifique.
 *
 * V2.5.20 sous-chantiers V2.5.12.a (transport) et V2.5.12.b (hébergement) :
 * lecture de `offre.meta` jsonb pour afficher les infos spécifiques par
 * type — départ/arrivée/horaires pour transport, dates/capacité pour
 * hébergement. Présenté sous la photo dans un encart compact identifiable
 * au coup d'œil (mini-icônes en ligne).
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

        {/* V2.5.12.a — encart BlaBlaCar pour transport : départ → arrivée + horaire */}
        {offre.type === 'transport' ? <EncartTransport meta={offre.meta} /> : null}

        {/* V2.5.12.b — encart Airbnb pour hébergement : dates + capacité */}
        {offre.type === 'hebergement' ? <EncartHebergement meta={offre.meta} /> : null}

        <div className="flex items-center gap-1.5 text-xs text-text-3">
          <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
          <span className="line-clamp-1">{offre.lieu}</span>
        </div>

        <p className="line-clamp-3 text-xs text-text-2 leading-relaxed">{offre.description}</p>
      </div>
    </article>
  );
}

/** Encart spécifique transport : départ → arrivée + horaire si présent. */
function EncartTransport({ meta }: { meta: unknown }) {
  const depart = lireMeta(meta, 'depart');
  const arrivee = lireMeta(meta, 'arrivee');
  const horaire = lireMeta(meta, 'horaire') ?? lireMeta(meta, 'date_depart');
  if (depart === null && arrivee === null && horaire === null) return null;
  return (
    <div className="grid gap-1 rounded-md bg-surface-2 p-2 text-xs">
      {depart !== null && arrivee !== null ? (
        <div className="flex items-center gap-1.5 font-bold text-text-1">
          <span className="line-clamp-1">{depart}</span>
          <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
          <span className="line-clamp-1">{arrivee}</span>
        </div>
      ) : null}
      {horaire !== null ? (
        <div className="flex items-center gap-1.5 text-text-3">
          <Clock size={12} strokeWidth={1.5} aria-hidden="true" />
          <span>{horaire}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Encart spécifique hébergement : dates + capacité si présents. */
function EncartHebergement({ meta }: { meta: unknown }) {
  const dateDebut = lireMeta(meta, 'date_debut');
  const dateFin = lireMeta(meta, 'date_fin');
  const capaciteRaw = lireMeta(meta, 'capacite');
  if (dateDebut === null && dateFin === null && capaciteRaw === null) return null;
  return (
    <div className="grid gap-1 rounded-md bg-surface-2 p-2 text-xs">
      {dateDebut !== null || dateFin !== null ? (
        <div className="flex items-center gap-1.5 font-bold text-text-1">
          <Calendar size={12} strokeWidth={1.5} aria-hidden="true" />
          <span className="line-clamp-1">
            {dateDebut !== null ? dateDebut : '?'} → {dateFin !== null ? dateFin : '?'}
          </span>
        </div>
      ) : null}
      {capaciteRaw !== null ? (
        <div className="flex items-center gap-1.5 text-text-3">
          <Users size={12} strokeWidth={1.5} aria-hidden="true" />
          <span>
            {capaciteRaw} personne{capaciteRaw === '1' ? '' : 's'}
          </span>
        </div>
      ) : null}
    </div>
  );
}

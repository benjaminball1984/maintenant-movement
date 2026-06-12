import { ImageAffiche } from '@/components/ui';
import type { MediaEnrichi } from '@/lib/media/requetes';
import { formaterRelativePassee } from '@/lib/mobilisations/dates';
import Link from 'next/link';

/**
 * Mosaïque de la page Maintenant Médias (revue 2026-06-12, demande Ben,
 * inspiration reuters.com) :
 *
 *   - L'article À LA UNE (le même que la une de la home) : image plus
 *     grande, extrait d'au moins 7 lignes.
 *   - Les contenus MAISON (éditos, tribunes, articles publiés par
 *     l'admin) : toujours affichés au format « important ».
 *   - Les brèves de la revue de presse : « importantes » (image + titre +
 *     5-7 lignes) ou « annexes » (logo du média en grand + titre + texte
 *     généreux : demande Ben 2026-06-12, « si pas d'image mettre le logo
 *     plus gros, et un peu plus de texte », jamais de grand blanc).
 *
 * Classement antichronologique. « Lire la suite » d'une brève mène au
 * site source (nouvel onglet) ; un contenu maison mène à sa fiche.
 */

interface MosaiqueMediasProps {
  /** Article épinglé à la une (affiché en tête, exclu du flux). */
  une: MediaEnrichi | null;
  /**
   * Contenus de la rédaction (hors une) : TOUJOURS affichés en tête,
   * quelle que soit leur date (revue 2026-06-12, Ben).
   */
  redaction?: MediaEnrichi[];
  /** Flux antichronologique (sans la une ni la rédaction). */
  medias: MediaEnrichi[];
}

const LIBELLE_TYPE: Record<string, string> = {
  edito: 'Édito',
  tribune: 'Tribune',
  article: 'Article',
  breve: 'Brève',
  dessin: 'Dessin',
  podcast: 'Podcast',
  video: 'Vidéo',
  live: 'Live',
  newsletter: 'Newsletter',
};

function estBreveExterne(media: MediaEnrichi): boolean {
  return media.type === 'breve' && media.source_url !== null;
}

function estImportant(media: MediaEnrichi): boolean {
  // Contenus maison toujours en grand ; brèves selon leur drapeau.
  return media.type !== 'breve' || media.importante;
}

/**
 * Sur-titre de carte : pour une brève, le NOM DU MÉDIA SOURCE (décision
 * Ben 2026-06-12 : « enlève les badges brève et remplace par le nom du
 * média source ») ; pour un contenu maison, le type éditorial.
 */
function SurTitre({ media }: { media: MediaEnrichi }) {
  const texte =
    media.type === 'breve'
      ? (media.provenance_externe ?? 'Revue de presse')
      : (LIBELLE_TYPE[media.type] ?? media.type);
  return <p className="text-[11px] font-bold uppercase tracking-cap text-text-3">{texte}</p>;
}

/** Ligne de provenance : auteur·ice maison s'il y a lieu, heure, langue. */
function Provenance({ media }: { media: MediaEnrichi }) {
  const heure = media.publie_le !== null ? formaterRelativePassee(media.publie_le) : '';
  const auteurice =
    media.provenance_externe !== null
      ? ''
      : [media.auteurice_prenom, media.auteurice_nom]
          .filter((s) => s !== null && s !== '')
          .join(' ') || 'Maintenant!';
  return (
    <p className="text-xs text-text-3">
      {auteurice !== '' ? <span className="font-bold text-text-2">{auteurice} · </span> : null}
      {heure}
      {media.langue !== null && media.langue !== 'fr' ? ` · ${media.langue.toUpperCase()}` : ''}
    </p>
  );
}

function Etiquettes({ media }: { media: MediaEnrichi }) {
  if (media.tags === null || media.tags.length === 0) return null;
  return (
    <p className="flex flex-wrap gap-1.5">
      {media.tags.map((tag) => (
        <Link
          key={tag}
          href={`/s-informer/media?tag=${encodeURIComponent(tag)}`}
          className="rounded-pill border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-text-3 hover:border-brand hover:text-text-1"
        >
          {tag}
        </Link>
      ))}
    </p>
  );
}

/** Lien de l'item : fiche interne (maison) ou site source (brève). */
function LienMedia({
  media,
  className,
  children,
}: {
  media: MediaEnrichi;
  className?: string;
  children: React.ReactNode;
}) {
  if (estBreveExterne(media) && media.source_url !== null) {
    return (
      <a href={media.source_url} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={`/s-informer/media/${media.slug}`} className={className}>
      {children}
    </Link>
  );
}

function CarteUne({ media }: { media: MediaEnrichi }) {
  return (
    <article className="grid gap-4 rounded-lg border border-border bg-surface p-4 md:grid-cols-5 md:p-6">
      {media.vignette_url !== null ? (
        <LienMedia media={media} className="md:col-span-3">
          <ImageAffiche
            src={media.vignette_url}
            alt=""
            className="aspect-[16/10] w-full rounded-md"
            sizes="(min-width: 1024px) 640px, 100vw"
          />
        </LienMedia>
      ) : null}
      <div
        className={`grid content-start gap-3 ${media.vignette_url !== null ? 'md:col-span-2' : 'md:col-span-5'}`}
      >
        <p className="text-xs font-bold uppercase tracking-cap text-brand">À la une</p>
        <LienMedia media={media} className="hover:underline">
          <h2 className="text-2xl font-bold leading-tight text-text-1">{media.titre}</h2>
        </LienMedia>
        <p className="line-clamp-[10] text-sm leading-relaxed text-text-2">{media.corps}</p>
        <Provenance media={media} />
        <Etiquettes media={media} />
        <LienMedia media={media} className="text-sm font-bold text-brand hover:underline">
          {estBreveExterne(media) ? 'Lire la suite ↗' : 'Lire la suite'}
        </LienMedia>
      </div>
    </article>
  );
}

function CarteImportante({ media }: { media: MediaEnrichi }) {
  return (
    <article className="flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      {media.vignette_url !== null ? (
        <LienMedia media={media}>
          <ImageAffiche
            src={media.vignette_url}
            alt=""
            className="aspect-[16/9] w-full rounded-md"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </LienMedia>
      ) : null}
      <SurTitre media={media} />
      <LienMedia media={media} className="hover:underline">
        <h3 className="text-lg font-bold leading-snug text-text-1">{media.titre}</h3>
      </LienMedia>
      <p className="line-clamp-[7] text-sm leading-relaxed text-text-2">{media.corps}</p>
      <div className="mt-auto grid gap-2">
        <Provenance media={media} />
        <Etiquettes media={media} />
        <LienMedia media={media} className="text-sm font-bold text-brand hover:underline">
          {estBreveExterne(media) ? 'Lire la suite ↗' : 'Lire la suite'}
        </LienMedia>
      </div>
    </article>
  );
}

function CarteAnnexe({ media }: { media: MediaEnrichi }) {
  return (
    <article className="flex h-full flex-col gap-2 rounded-md border border-border bg-surface-2 p-3">
      <SurTitre media={media} />
      <div className="flex items-start gap-3">
        {media.vignette_url !== null ? (
          <LienMedia media={media} className="shrink-0">
            {/* Logo du média (ou vignette de secours) en GRAND format :
                demande Ben 2026-06-12, « si pas d'image mettre le logo
                plus gros ». */}
            <img
              src={media.vignette_url}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              className="h-24 w-24 rounded-md border border-border bg-surface object-cover p-1"
            />
          </LienMedia>
        ) : null}
        <LienMedia media={media} className="hover:underline">
          <h3 className="text-base font-bold leading-snug text-text-1">{media.titre}</h3>
        </LienMedia>
      </div>
      {/* Texte généreux (jusqu'à 9 lignes au lieu de 3-4) : remplit la
          hauteur de la rangée, plus de grand blanc sous la brève. */}
      <p className="line-clamp-[9] text-sm leading-relaxed text-text-2">{media.corps}</p>
      <div className="mt-auto grid gap-2">
        <Provenance media={media} />
        <LienMedia media={media} className="text-sm font-bold text-brand hover:underline">
          {estBreveExterne(media) ? 'Lire la suite ↗' : 'Lire la suite'}
        </LienMedia>
      </div>
    </article>
  );
}

export function MosaiqueMedias({ une, redaction = [], medias }: MosaiqueMediasProps) {
  return (
    <div className="grid gap-6">
      {une !== null ? <CarteUne media={une} /> : null}

      {redaction.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-xs font-bold uppercase tracking-cap text-brand">La rédaction</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {redaction.map((media) => (
              <CarteImportante key={media.id} media={media} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {medias.map((media) =>
          estImportant(media) ? (
            <CarteImportante key={media.id} media={media} />
          ) : (
            <CarteAnnexe key={media.id} media={media} />
          ),
        )}
      </div>
    </div>
  );
}

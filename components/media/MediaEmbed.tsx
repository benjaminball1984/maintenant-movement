'use client';

import { useState } from 'react';

/**
 * Lecteur intégré d'un contenu de la revue de presse multi-format
 * (demande Ben 2026-06-13).
 *
 * - vidéo / live : façade (vignette + bouton lecture) qui charge l'iframe
 *   YouTube sans cookie UNIQUEMENT au clic (perf : pas 20 iframes au
 *   chargement de la page, et pas de cookie YouTube tant qu'on ne lit pas).
 * - podcast : lecteur audio HTML5 natif (léger, pas de façade).
 *
 * Les dessins n'utilisent pas ce composant : leur image EST le contenu,
 * affichée directement dans la carte.
 */

interface MediaEmbedProps {
  /** Type éditorial du media. */
  type: string;
  /** URL d'embed (vidéo/live) ou de fichier audio (podcast). */
  mediaUrl: string;
  /** Vignette de façade (miniature vidéo). */
  vignetteUrl: string | null;
  /** Titre, pour les libellés d'accessibilité. */
  titre: string;
}

export function MediaEmbed({ type, mediaUrl, vignetteUrl, titre }: MediaEmbedProps) {
  const [lecture, setLecture] = useState(false);

  if (type === 'podcast') {
    return (
      // biome-ignore lint/a11y/useMediaCaption: podcast tiers sans piste de sous-titres disponible.
      <audio controls preload="none" className="w-full" aria-label={`Écouter : ${titre}`}>
        <source src={mediaUrl} />
        Votre navigateur ne peut pas lire cet audio.
      </audio>
    );
  }

  // vidéo / live : façade puis iframe au clic.
  if (lecture) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-md">
        <iframe
          src={`${mediaUrl}?autoplay=1`}
          title={titre}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLecture(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-md bg-surface-2"
      aria-label={`Lire la vidéo : ${titre}`}
    >
      {vignetteUrl !== null ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={vignetteUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:opacity-90"
        />
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 transition group-hover:bg-brand">
          {/* Triangle « lecture ». */}
          <span className="ml-1 h-0 w-0 border-y-8 border-l-[14px] border-y-transparent border-l-white" />
        </span>
      </span>
    </button>
  );
}

/**
 * Rendu des blocs personnalisables d'un espace collectif (V2.5.5).
 *
 * Server Component : charge les blocs via `listerBlocsEspace` et les
 * affiche dans l'ordre, en dispatchant chaque bloc vers son composant
 * de rendu spécialisé selon le `type`.
 *
 * Si l'espace n'a aucun bloc personnalisé, le composant ne rend rien
 * (pas même une section vide). Pas de pollution visuelle.
 */

import { listerBlocsEspace } from '@/lib/blocs-espace/requetes';
import type { TypeEspace } from '@/lib/blocs-espace/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface RenduBlocsEspaceProps {
  espaceType: TypeEspace;
  espaceId: string;
  /** Classe supplémentaire sur le `<section>` (espacement, padding...) */
  className?: string;
}

export async function RenduBlocsEspace({ espaceType, espaceId, className }: RenduBlocsEspaceProps) {
  const blocs = await listerBlocsEspace(espaceType, espaceId);
  if (blocs.length === 0) return null;

  return (
    <section aria-label="Blocs personnalisés de l'espace" className={cn('grid gap-4', className)}>
      {blocs.map((bloc, idx) => {
        // Pas d'id stable côté décodé (perdu lors de la validation),
        // donc on utilise l'index comme key. Sûr ici car la liste est
        // ordonnée et non triable côté client.
        const key = `${espaceType}-${espaceId}-${idx}`;
        switch (bloc.type) {
          case 'texte':
            return (
              <div key={key} className="whitespace-pre-line text-text-2 leading-relaxed">
                {bloc.contenu.texte}
              </div>
            );
          case 'image':
            return (
              <figure key={key} className="grid gap-2">
                <div className="relative aspect-[16/9] overflow-hidden rounded-md border border-border">
                  <Image
                    src={bloc.contenu.url}
                    alt={bloc.contenu.alt}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="object-cover"
                  />
                </div>
                {bloc.contenu.legende !== undefined && bloc.contenu.legende.trim() !== '' ? (
                  <figcaption className="text-sm text-text-3">{bloc.contenu.legende}</figcaption>
                ) : null}
              </figure>
            );
          case 'lien': {
            const externe = bloc.contenu.externe === true;
            const cible = externe ? '_blank' : undefined;
            const rel = externe ? 'noopener noreferrer' : undefined;
            return (
              <Link
                key={key}
                href={bloc.contenu.url}
                target={cible}
                rel={rel}
                className="text-brand underline-offset-4 hover:underline"
              >
                {bloc.contenu.libelle}
                {externe ? ' ↗' : ''}
              </Link>
            );
          }
          case 'bouton': {
            const variante = bloc.contenu.variante ?? 'primary';
            const classes =
              variante === 'primary'
                ? 'bg-grad text-white shadow-brand hover:brightness-110'
                : variante === 'ghost'
                  ? 'bg-surface text-text-1 border border-border hover:bg-surface-2'
                  : 'bg-transparent text-brand border border-brand hover:bg-brand-light';
            const externe = bloc.contenu.url.startsWith('http');
            return (
              <Link
                key={key}
                href={bloc.contenu.url}
                target={externe ? '_blank' : undefined}
                rel={externe ? 'noopener noreferrer' : undefined}
                className={cn(
                  'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 font-body text-sm font-bold transition',
                  classes,
                )}
              >
                {bloc.contenu.libelle}
                {externe ? ' ↗' : ''}
              </Link>
            );
          }
        }
      })}
    </section>
  );
}

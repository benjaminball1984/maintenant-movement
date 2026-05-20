import { Badge, Card, Heading } from '@/components/ui';
import type { VariantBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Une « Une » de la page d'accueil : un encart à fort impact visuel pour
 * mettre en avant un contenu (pétition, article, mobilisation, cagnotte).
 *
 * Le composant est générique. Les 4 unes spécifiques (UnePetition,
 * UneArticle, UneMobilisation, UneCagnotte) l'utilisent en lui passant
 * leurs props propres + un CTA.
 *
 * Quand aucun contenu n'est disponible (cas actuel, phases 3+ pas
 * encore livrées), on affiche un état vide avec un lien vers l'espace
 * correspondant. Pas d'invention de fake-data.
 */

export interface UneProps {
  /** Étiquette colorée en haut (« Pétition », « Article », etc.). */
  type: string;
  /** Couleur de l'étiquette : aligne sur les variantes Badge. */
  couleur: VariantBadge;
  /** Titre cliquable de la une, ou null si aucun contenu actif. */
  titre: string | null;
  /** Sous-titre / chapô court. */
  chapo?: string;
  /** Lien vers la cible (si `titre` fourni). */
  href?: string;
  /** Libellé du bouton d'action. */
  cta?: string;
  /** Lien « voir tous » vers l'index de l'espace. */
  voirTousHref: string;
  voirTousLibelle: string;
  /** État vide à afficher quand `titre` est null. */
  enAttente?: ReactNode;
}

export function UneSection({
  type,
  couleur,
  titre,
  chapo,
  href,
  cta,
  voirTousHref,
  voirTousLibelle,
  enAttente,
}: UneProps) {
  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <Badge variant={couleur}>{type}</Badge>
        <Link href={voirTousHref} className="text-xs text-text-3 hover:text-brand">
          {voirTousLibelle} →
        </Link>
      </header>

      {titre !== null && href !== undefined && cta !== undefined ? (
        <>
          <Heading niveau={3} className="text-2xl">
            <Link href={href} className="text-text-1 underline-offset-4 hover:underline">
              {titre}
            </Link>
          </Heading>
          {chapo !== undefined ? <p className="text-text-2">{chapo}</p> : null}
          <Link
            href={href}
            className={cn(
              'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
              'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
            )}
          >
            {cta}
          </Link>
        </>
      ) : (
        <div className="text-text-3">
          {enAttente ?? <p>Aucun contenu actif pour le moment. Reviens bientôt.</p>}
        </div>
      )}
    </Card>
  );
}

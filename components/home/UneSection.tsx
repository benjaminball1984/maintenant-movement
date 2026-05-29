import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
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
  /**
   * Cle CMS du badge (optionnelle). Si fournie, le badge devient editable
   * admin via TexteEditableAdmin. `estAdmin` doit aussi etre fourni.
   */
  cleBadge?: string;
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
  /**
   * Cle CMS du CTA (optionnelle). Si fournie + estAdmin, editable admin.
   */
  cleCta?: string;
  /** Lien « voir tous » vers l'index de l'espace. */
  voirTousHref: string;
  voirTousLibelle: string;
  /** Cle CMS du libelle voirTous (optionnelle, idem cleBadge). */
  cleVoirTous?: string;
  /** True si l'utilisateurice connectee est admin. Active l'edition CMS. */
  estAdmin?: boolean;
  /** État vide à afficher quand `titre` est null. */
  enAttente?: ReactNode;
}

export function UneSection({
  type,
  cleBadge,
  couleur,
  titre,
  chapo,
  href,
  cta,
  cleCta,
  voirTousHref,
  voirTousLibelle,
  cleVoirTous,
  estAdmin = false,
  enAttente,
}: UneProps) {
  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        {cleBadge !== undefined ? (
          <TexteEditableAdmin
            cle={cleBadge}
            valeurInitiale={type}
            estAdmin={estAdmin}
            libelle={`texte du badge ${cleBadge}`}
            longueurMax={40}
          >
            {(t) => <Badge variant={couleur}>{t}</Badge>}
          </TexteEditableAdmin>
        ) : (
          <Badge variant={couleur}>{type}</Badge>
        )}
        {cleVoirTous !== undefined ? (
          <TexteEditableAdmin
            cle={cleVoirTous}
            valeurInitiale={voirTousLibelle}
            estAdmin={estAdmin}
            libelle={`libelle voir tous ${cleVoirTous}`}
            longueurMax={60}
          >
            {(t) => (
              <Link href={voirTousHref} className="text-xs text-text-3 hover:text-brand">
                {t} →
              </Link>
            )}
          </TexteEditableAdmin>
        ) : (
          <Link href={voirTousHref} className="text-xs text-text-3 hover:text-brand">
            {voirTousLibelle} →
          </Link>
        )}
      </header>

      {titre !== null && href !== undefined && cta !== undefined ? (
        <>
          <Heading niveau={2} apparenceComme={3} className="text-2xl">
            <Link href={href} className="text-text-1 underline-offset-4 hover:underline">
              {titre}
            </Link>
          </Heading>
          {chapo !== undefined ? <p className="text-text-2">{chapo}</p> : null}
          {cleCta !== undefined ? (
            <TexteEditableAdmin
              cle={cleCta}
              valeurInitiale={cta}
              estAdmin={estAdmin}
              libelle={`CTA ${cleCta}`}
              longueurMax={50}
            >
              {(t) => (
                <Link
                  href={href}
                  className={cn(
                    'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
                    'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
                  )}
                >
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
          ) : (
            <Link
              href={href}
              className={cn(
                'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
                'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
              )}
            >
              {cta}
            </Link>
          )}
        </>
      ) : (
        <div className="text-text-3">
          {enAttente ?? <p>Aucun contenu actif pour le moment. Reviens bientôt.</p>}
        </div>
      )}
    </Card>
  );
}

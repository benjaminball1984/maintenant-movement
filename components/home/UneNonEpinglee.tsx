import { Badge, Card } from '@/components/ui';
import type { VariantBadge } from '@/components/ui/Badge';
import { PinOff } from 'lucide-react';
import Link from 'next/link';

/**
 * Emplacement de la une resté vide, vu par l'administration seulement.
 *
 * Depuis la décision de Lilou/Ben du 15/08/2026, la une de l'accueil ne
 * montre QUE ce que l'administration a épinglé (cf. `lib/home/une.ts`).
 * Quand un emplacement n'a rien d'épinglé :
 *
 *   - pour une visiteuse ou un visiteur, le bloc **n'existe pas** : la
 *     page d'accueil ne montre pas un cadre vide, elle est simplement
 *     plus courte. On ne raconte pas non plus « rien n'est publié »,
 *     ce serait faux : il y a du contenu, il n'est juste pas choisi ;
 *   - pour l'administration, ce cadre en pointillés prend sa place, avec
 *     le raccourci vers la console d'épinglage. C'est le seul moyen de
 *     voir depuis l'accueil qu'un emplacement attend une décision.
 *
 * Les textes sont volontairement en dur : ce sont des messages de service
 * réservés à l'administration (comme le bouton « Mettre à la une »), pas
 * du contenu public éditable via le CMS (le système de gestion de contenu,
 * l'interface où Lilou/Ben modifie les textes sans toucher au code).
 */
export function UneNonEpinglee({
  type,
  couleur,
}: {
  /** Libellé du badge de l'emplacement (« Pétition en cours », etc.). */
  type: string;
  /** Couleur du badge, la même que celle de la une remplie. */
  couleur: VariantBadge;
}) {
  return (
    <Card variant="ombre" className="grid gap-3 border-dashed">
      <div className="flex items-center gap-2">
        <Badge variant={couleur}>{type}</Badge>
        <PinOff size={14} strokeWidth={1.5} className="text-text-3" aria-hidden="true" />
      </div>
      <p className="text-sm text-text-2">
        Aucun contenu épinglé à cet emplacement : il reste invisible pour les visiteur·ses.
      </p>
      <Link
        href="/admin/national/une"
        className="w-fit text-sm font-bold text-brand hover:underline"
      >
        Choisir ce qui va à la une
      </Link>
    </Card>
  );
}

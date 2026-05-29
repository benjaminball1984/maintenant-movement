import { BoutonEditerInline } from '@/components/contenu/BoutonEditerInline';
import type { ReactNode } from 'react';

/**
 * Composant inline d'édition d'un texte court (V2.5.22 — refonte).
 *
 * Auparavant un Client Component qui acceptait `children: (valeur) => ReactNode`
 * (render-prop). Ce pattern provoquait l'erreur Next.js 14 « Functions are
 * not valid as a child of Client Components » dès qu'un Server Component
 * appelait ce composant avec une fonction children (impossible de sérialiser
 * une fonction au boundary server → client).
 *
 * Refonte :
 *  - Ce composant est désormais un **Server Component** (pas de `'use client'`).
 *  - Il invoque `children(valeurInitiale)` côté serveur, donc passe un
 *    ReactNode sérialisable à React.
 *  - L'overlay d'édition « ✏️ » est délégué à `<BoutonEditerInline>`,
 *    un Client Component qui ne reçoit que des strings (cle, valeurInitiale).
 *  - Au save, le BoutonEditerInline fait `router.refresh()` pour récupérer
 *    la nouvelle valeur côté serveur sans navigation.
 *
 * La signature `children: (valeur: string) => ReactNode` reste **inchangée**,
 * donc les ~200 usages existants continuent à fonctionner sans modification.
 */

export interface TexteEditableAdminProps {
  /** Clé unique du contenu (ex. 'home.surtitre'). */
  cle: string;
  /** Valeur actuelle (depuis la base ou fallback). */
  valeurInitiale: string;
  /** True si l'utilisateurice connectée est admin. */
  estAdmin: boolean;
  /** Rendu enfant qui reçoit la valeur courante en argument. */
  children: (valeur: string) => ReactNode;
  /** Si true, utilise <textarea> au lieu de <input> en mode édition. */
  multilignes?: boolean;
  /** Longueur max acceptée (défaut 500). */
  longueurMax?: number;
  /** Label décrivant ce qu'on édite (pour l'aria-label). */
  libelle?: string;
}

export function TexteEditableAdmin({
  cle,
  valeurInitiale,
  estAdmin,
  children,
  multilignes = false,
  longueurMax = 500,
  libelle,
}: TexteEditableAdminProps) {
  // Le rendu de children se fait côté serveur ici → ReactNode sérialisable.
  const contenu = children(valeurInitiale);

  if (!estAdmin) {
    return <>{contenu}</>;
  }

  return (
    <span className="group relative inline-block">
      <BoutonEditerInline
        cle={cle}
        valeurInitiale={valeurInitiale}
        multilignes={multilignes}
        longueurMax={longueurMax}
        libelle={libelle}
      />
      {contenu}
    </span>
  );
}

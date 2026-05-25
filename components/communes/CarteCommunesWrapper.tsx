'use client';

import dynamic from 'next/dynamic';

/**
 * Wrapper client qui charge dynamiquement `<CarteCommunesReference>` en
 * désactivant le rendu serveur (MapLibre dépend de WebGL et de `window`).
 *
 * Next.js 14+ exige que `dynamic({ ssr: false })` soit appelé depuis un
 * Client Component : ce wrapper n'a pas d'autre raison d'exister.
 */
const CarteCommunesReference = dynamic(
  () => import('./CarteCommunesReference').then((m) => m.CarteCommunesReference),
  {
    ssr: false,
    loading: () => <Squelette />,
  },
);

export function CarteCommunesWrapper() {
  return <CarteCommunesReference />;
}

function Squelette() {
  return (
    <div
      className="grid h-[70vh] w-full place-items-center rounded-md border border-border bg-surface-2 text-text-3"
      aria-busy="true"
    >
      Chargement de la carte...
    </div>
  );
}

'use client';

import type { PointCarte } from '@/lib/carte/donnees';
import dynamic from 'next/dynamic';

interface CarteWrapperProps {
  points: PointCarte[];
}

/**
 * Wrapper client qui charge dynamiquement `<CarteUnifiee>` en désactivant
 * le rendu côté serveur. MapLibre dépend de WebGL et de `window`, ce qui
 * casse en SSR.
 *
 * Next.js 14+ exige que `dynamic({ ssr: false })` soit appelé depuis un
 * Client Component — d'où ce wrapper minimaliste, qui n'a aucune autre
 * raison d'exister.
 */
const CarteUnifiee = dynamic(() => import('./CarteUnifiee').then((m) => m.CarteUnifiee), {
  ssr: false,
  loading: () => <Squelette />,
});

export function CarteWrapper({ points }: CarteWrapperProps) {
  return <CarteUnifiee points={points} />;
}

function Squelette() {
  return (
    <div
      className="grid h-[70vh] w-full place-items-center rounded-lg border border-border bg-surface-2 text-text-3"
      aria-busy="true"
    >
      Chargement de la carte...
    </div>
  );
}

import { Container, SkeletonCarte } from '@/components/ui';

/**
 * État de chargement global (revue 2026, correctif C20).
 *
 * Squelette affiché pendant la navigation vers une page serveur, le temps que
 * ses données arrivent (Supabase, région Francfort). Réutilise le composant
 * `SkeletonCarte` (V2.4.85). Les espaces les plus lourds pourront poser leur
 * propre `loading.tsx` plus spécifique.
 */
export default function Chargement() {
  return (
    <Container className="py-12">
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Chargement en cours…"
      >
        {['a', 'b', 'c', 'd', 'e', 'f'].map((cle) => (
          <SkeletonCarte key={cle} />
        ))}
      </div>
    </Container>
  );
}

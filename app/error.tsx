'use client';

import { Button, Container, Heading } from '@/components/ui';

/**
 * Frontière d'erreur de segment (revue 2026, correctif C19).
 *
 * Capture toute exception non interceptée rendue sous le layout racine et
 * propose de réessayer, sans exposer le détail technique à l'usager. Next.js
 * journalise déjà l'erreur côté serveur (avec son `digest`). Copy serveur
 * conforme à la spec d'écriture (`03_VOCABULAIRE.md` §9).
 */
export default function Erreur({
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container taille="sm" className="py-16 text-center">
      <Heading niveau={1}>Quelque chose s'est mal passé</Heading>
      <p className="mt-3 text-text-2">
        On a été alerté·es de notre côté. Tu peux réessayer ; si le problème persiste, reviens dans
        un instant.
      </p>
      <div className="mt-6 flex justify-center">
        <Button onClick={reset}>Réessayer</Button>
      </div>
    </Container>
  );
}

'use client';

/**
 * Frontière d'erreur racine (revue 2026, correctif C19).
 *
 * Capture les erreurs du layout racine lui-même : à ce niveau les composants
 * et tokens du site ne sont pas garantis, on rend donc un document HTML
 * minimal autonome. Cas rare ; `app/error.tsx` couvre tout le reste.
 */
export default function ErreurGlobale({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          maxWidth: '32rem',
          margin: '4rem auto',
          padding: '0 1.5rem',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        <h1>Quelque chose s'est mal passé</h1>
        <p>On a été alerté·es de notre côté. Réessaie dans un instant.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: '1rem',
            padding: '0.6rem 1.2rem',
            border: 0,
            borderRadius: '0.5rem',
            background: '#E11D74',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}

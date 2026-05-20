import { defineConfig } from 'vitest/config';

/**
 * Configuration Vitest pour les tests unitaires.
 *
 * Environnement Node : les tests du chantier 0.1 portent sur la logique
 * pure (factories, helpers). L'environnement jsdom sera activé à partir
 * du chantier qui introduira des tests React.
 *
 * Les tests E2E sont gérés séparément par Playwright (cf. `playwright.config.ts`).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/e2e/**'],
    globals: false,
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname,
    },
  },
});

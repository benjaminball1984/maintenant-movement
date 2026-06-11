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
  // Le tsconfig du projet est en `jsx: preserve` (c'est Next.js qui compile
  // le JSX en prod). Pour que Vitest puisse rendre des composants `.tsx`
  // (ex : MarkdownLeger via renderToStaticMarkup), on demande à esbuild
  // d'utiliser le runtime JSX automatique de React, comme Next.js.
  esbuild: {
    jsx: 'automatic',
  },
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

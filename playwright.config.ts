import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests end-to-end.
 *
 * Au chantier 0.1, un seul navigateur (Chromium) suffit : les tests
 * vérifient l'absence de page blanche et de lien mort sur la home et la
 * page placeholder du système de design.
 *
 * Le `webServer` lance `npm run dev` automatiquement avant les tests.
 */
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI !== undefined ? 2 : 0,
  workers: process.env.CI !== undefined ? 1 : undefined,
  reporter: process.env.CI !== undefined ? 'github' : 'html',
  outputDir: './test-results',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: process.env.CI === undefined,
    timeout: 120 * 1000,
  },
});

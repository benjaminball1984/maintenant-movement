import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests end-to-end.
 *
 * Stratégie multi-format (chantier 12.3 polish) :
 *   - 5 viewports Chromium : mobile portrait/paysage, tablette
 *     portrait/paysage, desktop. Tous les tests tournent sur chaque
 *     viewport pour vérifier qu'aucune mise en page ne casse.
 *   - 2 navigateurs supplémentaires (Firefox, WebKit) sur viewport
 *     desktop : sanity cross-browser.
 *
 * Pour ne lancer qu'un seul viewport :
 *   npm run test:e2e -- --project=mobile-portrait
 *
 * Le `webServer` lance `npm run dev` automatiquement avant les tests.
 */
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const VIEWPORT_MOBILE_PORTRAIT = { width: 375, height: 667 };
const VIEWPORT_MOBILE_PAYSAGE = { width: 667, height: 375 };
const VIEWPORT_TABLETTE_PORTRAIT = { width: 768, height: 1024 };
const VIEWPORT_TABLETTE_PAYSAGE = { width: 1024, height: 768 };
const VIEWPORT_DESKTOP = { width: 1440, height: 900 };

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
      name: 'mobile-portrait',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT_MOBILE_PORTRAIT },
    },
    {
      name: 'mobile-paysage',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT_MOBILE_PAYSAGE },
    },
    {
      name: 'tablette-portrait',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT_TABLETTE_PORTRAIT },
    },
    {
      name: 'tablette-paysage',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT_TABLETTE_PAYSAGE },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT_DESKTOP },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'], viewport: VIEWPORT_DESKTOP },
    },
    {
      name: 'desktop-webkit',
      use: { ...devices['Desktop Safari'], viewport: VIEWPORT_DESKTOP },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: process.env.CI === undefined,
    timeout: 120 * 1000,
  },
});

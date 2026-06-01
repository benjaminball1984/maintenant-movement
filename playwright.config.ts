import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests end-to-end.
 *
 * Stratégie multi-format (chantier 12.3 polish) :
 *   - 5 viewports Chromium : mobile portrait/paysage, tablette
 *     portrait/paysage, desktop. Tous les tests tournent sur chaque
 *     viewport pour vérifier qu'aucune mise en page ne casse.
 *   - 2 navigateurs supplémentaires (Firefox, WebKit) sur viewport
 *     desktop : sanity cross-browser, activés uniquement quand la
 *     variable `PLAYWRIGHT_FULL=1` est définie. Évite de tenter de
 *     lancer des binaires non installés (cas CI de push, qui installe
 *     `chromium` seul). Le workflow programmé `ci-cross-browser.yml`
 *     positionne `PLAYWRIGHT_FULL=1` et installe les 3 navigateurs.
 *
 * Pour ne lancer qu'un seul viewport :
 *   npm run test:e2e -- --project=mobile-portrait
 *
 * Pour inclure Firefox + WebKit en local :
 *   PLAYWRIGHT_FULL=1 npm run test:e2e
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

const PROJETS_CHROMIUM = [
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
];

const PROJETS_CROSS_BROWSER = [
  {
    name: 'desktop-firefox',
    use: { ...devices['Desktop Firefox'], viewport: VIEWPORT_DESKTOP },
  },
  {
    name: 'desktop-webkit',
    use: { ...devices['Desktop Safari'], viewport: VIEWPORT_DESKTOP },
  },
];

// Firefox + WebKit ne sont inclus que sur opt-in explicite (PLAYWRIGHT_FULL=1).
// Cf. workflow `.github/workflows/ci-cross-browser.yml` (programmé mensuel).
const projets =
  process.env.PLAYWRIGHT_FULL === '1'
    ? [...PROJETS_CHROMIUM, ...PROJETS_CROSS_BROWSER]
    : PROJETS_CHROMIUM;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI !== undefined ? 2 : 0,
  // En CI : 4 workers en parallèle (les runners GitHub des dépôts publics ont
  // 4 vCPU). Les 5 viewports × 20 fichiers se répartissent sur les workers au
  // lieu de tourner les uns après les autres : environ 3 à 4 fois plus rapide,
  // sans retirer aucun test ni aucun viewport. Possible sans risque ici car en
  // CI la base de données est un bouchon (aucune écriture persistée), donc les
  // tests ne partagent pas d'état entre eux. `fullyParallel: false` est
  // conservé : les tests d'un même fichier restent ordonnés.
  workers: process.env.CI !== undefined ? 4 : undefined,
  reporter: process.env.CI !== undefined ? 'github' : 'html',
  outputDir: './test-results',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
  },
  projects: projets,
  webServer: {
    // En CI : on sert le BUILD de production (`next start`), qui ne recompile
    // pas les pages à la volée. Beaucoup plus rapide que `next dev` quand on
    // parcourt tout le site sur 5 viewports, et plus fidèle (on teste
    // l'artefact réellement déployé). Le job CI exécute `npm run build` juste
    // avant `npm run test:e2e`. En local : `next dev` pour le confort
    // (rechargement à chaud, réutilisation d'un serveur déjà lancé).
    command: process.env.CI !== undefined ? 'npm run start' : 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: process.env.CI === undefined,
    timeout: 120 * 1000,
  },
});

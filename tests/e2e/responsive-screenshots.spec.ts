import { expect, test } from '@playwright/test';

/**
 * Captures de référence par viewport pour les pages publiques clés.
 *
 * Objectif : avoir une preuve visuelle reproductible que le polish
 * responsive (chantier 12) ne régresse pas. Chaque test charge une page,
 * attend l'état stable, prend une capture pleine page. La capture est
 * écrite dans `tests/screenshots/responsive/<projet>/<page>.png` (le
 * nom de projet vient de `playwright.config.ts` : mobile-portrait,
 * mobile-paysage, tablette-portrait, tablette-paysage, desktop, etc.).
 *
 * Les captures ne sont PAS comparées pixel à pixel (pas de
 * `toHaveScreenshot()`) : on les écrit pour l'audit visuel humain. Le
 * test vérifie juste que la page se charge sans erreur HTTP.
 *
 * Pour régénérer toutes les captures :
 *   npm run test:e2e -- responsive-screenshots
 */
const PAGES_CIBLES: { chemin: string; nom: string }[] = [
  { chemin: '/', nom: 'home' },
  { chemin: '/agir', nom: 'agir' },
  { chemin: '/comprendre/doctrine', nom: 'comprendre-doctrine' },
  { chemin: '/mobiliser/petitions', nom: 'mobiliser-petitions' },
  { chemin: '/s-entraider/marche', nom: 's-entraider-marche' },
  { chemin: '/carte', nom: 'carte' },
  { chemin: '/connexion', nom: 'connexion' },
];

for (const cible of PAGES_CIBLES) {
  test(`capture responsive ${cible.nom}`, async ({ page }, infos) => {
    const reponse = await page.goto(cible.chemin);
    expect(reponse?.status() ?? 0, `${cible.chemin} doit répondre 200`).toBeLessThan(400);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `tests/screenshots/responsive/${infos.project.name}/${cible.nom}.png`,
      fullPage: true,
    });
  });
}

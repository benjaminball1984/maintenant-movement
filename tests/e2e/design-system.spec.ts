import { expect, test } from '@playwright/test';

/**
 * Vérifie que le showcase `/design-system` (chantier 0.2) est complet :
 * - charge en 200,
 * - les 10 sections clés sont présentes,
 * - le toggle thème cycle bien auto -> light -> dark -> auto et écrit
 *   `data-theme` sur <html> en conséquence.
 */
test.describe('/design-system', () => {
  test('charge la page et affiche les sections clés', async ({ page }) => {
    const reponse = await page.goto('/design-system');
    expect(reponse?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1, name: 'Système de design' })).toBeVisible();

    for (const titre of [
      'Palette',
      'Gradients',
      'Typographie',
      'Boutons',
      'Formulaires',
      'Badges',
      'Alertes',
      'Cartes',
      'Ombres',
      'Espacements (échelle 4 px)',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name: titre })).toBeVisible();
    }
  });

  test('le toggle thème cycle auto -> light -> dark -> auto', async ({ page }) => {
    await page.goto('/design-system');

    const html = page.locator('html');
    const toggle = page.getByRole('button', { name: /Basculer vers/ });

    // État initial après hydratation : auto (pas de data-theme posé)
    await expect(toggle).toHaveAttribute('data-mode', 'auto');
    await expect(html).not.toHaveAttribute('data-theme', /.*/);

    // 1er clic : light
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-mode', 'light');
    await expect(html).toHaveAttribute('data-theme', 'light');

    // 2e clic : dark
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-mode', 'dark');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // 3e clic : retour à auto
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-mode', 'auto');
    await expect(html).not.toHaveAttribute('data-theme', /.*/);
  });

  test("le formulaire de démo n'envoie rien (preventDefault)", async ({ page }) => {
    await page.goto('/design-system');
    await page.getByLabel('Prénom').fill('Camille');
    await page.getByLabel('Adresse email', { exact: false }).first().fill('test@exemple.fr');
    await page.getByRole('button', { name: 'Envoyer' }).click();
    // L'URL ne doit pas changer : preventDefault empêche la soumission.
    await expect(page).toHaveURL(/\/design-system$/);
  });
});

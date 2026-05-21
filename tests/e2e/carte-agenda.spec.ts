import { expect, test } from '@playwright/test';

test.describe('Carte + Agenda (chantier 6.1 / 6.2)', () => {
  test('rend /carte', async ({ page }) => {
    const reponse = await page.goto('/carte');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Carte des actions' })).toBeVisible();
  });

  test('rend /agenda', async ({ page }) => {
    const reponse = await page.goto('/agenda');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible();
  });

  test('agenda affiche le formulaire de filtres', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page.getByLabel('Jour')).toBeVisible();
    await expect(page.getByLabel('Département')).toBeVisible();
    await expect(page.getByLabel('Type')).toBeVisible();
  });

  test('agenda accepte un filtre dans l’URL', async ({ page }) => {
    const reponse = await page.goto('/agenda?type=mobilisation');
    expect(reponse?.status()).toBe(200);
  });
});

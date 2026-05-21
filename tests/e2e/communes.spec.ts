import { expect, test } from '@playwright/test';

test.describe('Communes / Fédérations / Confédérations / Assemblée', () => {
  test('rend /agir/communes', async ({ page }) => {
    const reponse = await page.goto('/agir/communes');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: /Communes libres/ })).toBeVisible();
  });

  test('rend /agir/federations', async ({ page }) => {
    const reponse = await page.goto('/agir/federations');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Fédérations' })).toBeVisible();
  });

  test('rend /agir/confederations', async ({ page }) => {
    const reponse = await page.goto('/agir/confederations');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Confédérations' })).toBeVisible();
  });

  test('rend /agir/assemblee avec 4 onglets', async ({ page }) => {
    const reponse = await page.goto('/agir/assemblee');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('link', { name: 'Toutes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Communes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Fédérations' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Confédérations' })).toBeVisible();
  });

  test('création commune libre redirige sans auth', async ({ page }) => {
    await page.goto('/agir/communes/nouvelle');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('création fédération redirige sans auth', async ({ page }) => {
    await page.goto('/agir/federations/nouvelle');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('commune inexistante → 404', async ({ page }) => {
    const reponse = await page.goto('/agir/communes/commune-inexistante-zzz');
    expect(reponse?.status()).toBe(404);
  });
});

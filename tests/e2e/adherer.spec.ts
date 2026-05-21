import { expect, test } from '@playwright/test';

test.describe('Adhérer', () => {
  test('rend la page hub /agir/adherer', async ({ page }) => {
    const reponse = await page.goto('/agir/adherer');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Adhérer' })).toBeVisible();
  });

  test('expose 3 chemins (Gratuit / 12 € / 12 99-coin)', async ({ page }) => {
    await page.goto('/agir/adherer');
    await expect(page.getByRole('heading', { level: 2, name: 'Gratuit' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '12 €' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '12 99-coin' })).toBeVisible();
  });

  test('chemin gratuit redirige sans auth', async ({ page }) => {
    await page.goto('/agir/adherer/gratuit');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('chemin euros redirige sans auth', async ({ page }) => {
    await page.goto('/agir/adherer/euros');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('chemin T99CP redirige sans auth', async ({ page }) => {
    await page.goto('/agir/adherer/t99cp');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('page retour rend (sans paramètres → message d’erreur)', async ({ page }) => {
    const reponse = await page.goto('/agir/adherer/retour');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByText(/Paramètres manquants/)).toBeVisible();
  });
});

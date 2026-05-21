import { expect, test } from '@playwright/test';

test.describe('SEL', () => {
  test('rend la page liste', async ({ page }) => {
    const reponse = await page.goto('/s-entraider/sel');
    expect(reponse?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: /SEL — Système d’échange local/ }),
    ).toBeVisible();
  });

  test('a les 3 onglets (Tous, Services, Volontariats)', async ({ page }) => {
    await page.goto('/s-entraider/sel');
    await expect(page.getByRole('link', { name: 'Tous' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Services' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volontariats' })).toBeVisible();
  });

  test('/s-entraider/sel/nouveau redirige sans auth', async ({ page }) => {
    await page.goto('/s-entraider/sel/nouveau');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('slug inexistant → 404', async ({ page }) => {
    const reponse = await page.goto('/s-entraider/sel/service-inexistant-zzz');
    expect(reponse?.status()).toBe(404);
  });
});

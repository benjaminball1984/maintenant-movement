import { expect, test } from '@playwright/test';

test.describe('Sondages + stubs 7.3/7.5/7.6', () => {
  test('rend /s-informer/sondages', async ({ page }) => {
    const reponse = await page.goto('/s-informer/sondages');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Sondages' })).toBeVisible();
  });

  test('création sondage redirige sans auth', async ({ page }) => {
    await page.goto('/s-informer/sondages/nouveau');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('stubs : journal, reseau, decider rendent en 200', async ({ page }) => {
    for (const url of ['/s-informer/journal', '/s-informer/reseau', '/s-informer/decider']) {
      const reponse = await page.goto(url);
      expect(reponse?.status()).toBe(200);
    }
  });

  test('stub Décider affiche les 3 modes', async ({ page }) => {
    await page.goto('/s-informer/decider');
    await expect(page.getByText('Consensus')).toBeVisible();
    await expect(page.getByText("Levée d'objections")).toBeVisible();
    await expect(page.getByText('Vote au jugement majoritaire')).toBeVisible();
  });
});

import { expect, test } from '@playwright/test';

test.describe('Maintenant Radio', () => {
  test('rend /s-informer/radio', async ({ page }) => {
    const reponse = await page.goto('/s-informer/radio');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Maintenant Radio' })).toBeVisible();
  });

  test("affiche la bannière 'pas encore branchée' en mock", async ({ page }) => {
    await page.goto('/s-informer/radio');
    await expect(page.getByText('Radio pas encore branchée')).toBeVisible();
  });
});

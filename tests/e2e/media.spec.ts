import { expect, test } from '@playwright/test';

test.describe('Média Maintenant', () => {
  test('rend /s-informer/media', async ({ page }) => {
    const reponse = await page.goto('/s-informer/media');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Média Maintenant' })).toBeVisible();
  });

  test('a 10 onglets (Tous + 9 types)', async ({ page }) => {
    await page.goto('/s-informer/media');
    for (const libelle of [
      'Tous',
      'Éditos',
      'Tribunes',
      'Articles',
      'Brèves',
      'Dessins',
      'Podcasts',
      'Vidéos',
      'Lives',
      'Newsletter',
    ]) {
      await expect(page.getByRole('link', { name: libelle, exact: true })).toBeVisible();
    }
  });

  test('slug inexistant → 404', async ({ page }) => {
    const reponse = await page.goto('/s-informer/media/inexistant-zzz');
    expect(reponse?.status()).toBe(404);
  });
});

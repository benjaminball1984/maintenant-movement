import { expect, test } from '@playwright/test';

test.describe('Maintenant Médias', () => {
  test('rend /s-informer/media', async ({ page }) => {
    const reponse = await page.goto('/s-informer/media');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Maintenant Médias' })).toBeVisible();
  });

  test('a les onglets de format, sans rubrique « Lives »', async ({ page }) => {
    await page.goto('/s-informer/media');
    for (const libelle of ['Rédaction', 'Dessins', 'Podcasts', 'Vidéos']) {
      await expect(page.getByRole('link', { name: libelle, exact: true })).toBeVisible();
    }
    // Rubrique « Lives » supprimée (Ben 2026-06-15).
    await expect(page.getByRole('link', { name: 'Lives', exact: true })).toHaveCount(0);
  });

  test('slug inexistant → 404', async ({ page }) => {
    const reponse = await page.goto('/s-informer/media/inexistant-zzz');
    expect(reponse?.status()).toBe(404);
  });
});

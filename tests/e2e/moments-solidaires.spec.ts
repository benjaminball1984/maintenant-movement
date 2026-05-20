import { expect, test } from '@playwright/test';

test.describe('Moments solidaires', () => {
  test('rend la liste /agir/moments-solidaires', async ({ page }) => {
    const reponse = await page.goto('/agir/moments-solidaires');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Moments solidaires' })).toBeVisible();
  });

  test('a un onglet par type + "Tous"', async ({ page }) => {
    await page.goto('/agir/moments-solidaires');
    for (const libelle of [
      'Tous',
      'Porte-à-porte solidaire',
      'Maraude solidaire',
      'Vide-grenier solidaire',
      'Soutien',
      'Manifestation',
      'Rencontre',
      'Concert solidaire',
      'Repas solidaire',
    ]) {
      await expect(page.getByRole('link', { name: libelle })).toBeVisible();
    }
  });

  test('création moment redirige sans auth', async ({ page }) => {
    await page.goto('/agir/moments-solidaires/nouveau');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('slug inexistant → 404', async ({ page }) => {
    const reponse = await page.goto('/agir/moments-solidaires/inexistant-zzz');
    expect(reponse?.status()).toBe(404);
  });
});

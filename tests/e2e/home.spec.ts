import { expect, test } from '@playwright/test';

/**
 * Vérifie que la page d'accueil temporaire (chantier 0.1) est fonctionnelle :
 * - répond en 200,
 * - affiche les éléments de titre fixés par la spec,
 * - le lien vers `/design-system` mène à la page placeholder,
 * - le lien retour ramène à `/`.
 */
test.describe('page d’accueil temporaire', () => {
  test('charge la home et affiche les éléments de titre', async ({ page }) => {
    const reponse = await page.goto('/');
    expect(reponse?.status()).toBe(200);

    await expect(page.getByText('La plateforme citoyenne des 99 %')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Maintenant!' })).toBeVisible();
    await expect(
      page.getByText(/Pour une vie digne et heureuse pour tous et toutes, dans un monde vivable\./),
    ).toBeVisible();
  });

  test('navigue vers le système de design et revient', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Système de design/ }).click();
    await expect(page).toHaveURL(/\/design-system$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Système de design' })).toBeVisible();

    await page.getByRole('link', { name: /Retour à l'accueil/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

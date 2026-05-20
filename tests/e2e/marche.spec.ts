import { expect, test } from '@playwright/test';

test.describe('Marché solidaire', () => {
  test('rend la page hub /s-entraider/marche', async ({ page }) => {
    const reponse = await page.goto('/s-entraider/marche');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: /Marché solidaire/ })).toBeVisible();
  });

  test('expose 3 onglets (Produit, Boutique, Minimarché)', async ({ page }) => {
    await page.goto('/s-entraider/marche');
    await expect(page.getByRole('heading', { level: 2, name: 'Produit' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Boutique' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Minimarché' })).toBeVisible();
  });

  test('liste les produits avec filtres tous / en vente / en don', async ({ page }) => {
    const reponse = await page.goto('/s-entraider/marche/produits');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('link', { name: 'Tous' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'En vente' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'En don' })).toBeVisible();
  });

  test('liste les boutiques', async ({ page }) => {
    const reponse = await page.goto('/s-entraider/marche/boutiques');
    expect(reponse?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: /Boutiques éphémères/ }),
    ).toBeVisible();
  });

  test('liste les minimarchés', async ({ page }) => {
    const reponse = await page.goto('/s-entraider/marche/minimarches');
    expect(reponse?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: /Minimarchés solidaires/ }),
    ).toBeVisible();
  });

  test('création produit redirige sans auth', async ({ page }) => {
    await page.goto('/s-entraider/marche/produits/nouveau');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('création boutique redirige sans auth', async ({ page }) => {
    await page.goto('/s-entraider/marche/boutiques/nouvelle');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('création minimarché redirige sans auth', async ({ page }) => {
    await page.goto('/s-entraider/marche/minimarches/nouveau');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('slug produit inexistant → 404', async ({ page }) => {
    const reponse = await page.goto('/s-entraider/marche/produits/produit-inexistant-zzz');
    expect(reponse?.status()).toBe(404);
  });
});

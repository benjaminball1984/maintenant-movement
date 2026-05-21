import { expect, test } from '@playwright/test';

/**
 * Tests E2E du sous-espace Mobilisations + Campagnes + Carte (chantier 3.2).
 *
 * Comme pour 3.1, sans BDD branchée localement, on cible :
 *   - le rendu en état vide,
 *   - la protection auth des pages création,
 *   - la 404 sur slug inexistant.
 *
 * Les flux complets « créer → participer → retirer » seront testés
 * manuellement après application des migrations 014-017.
 */

test.describe('liste mobilisations', () => {
  test('rend la page liste avec le titre et le CTA', async ({ page }) => {
    const reponse = await page.goto('/mobiliser/mobilisations');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Mobilisations' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Créer une mobilisation|Connecte-toi pour créer/ }),
    ).toBeVisible();
  });

  test('a un bouton vers la carte unifiée', async ({ page }) => {
    await page.goto('/mobiliser/mobilisations');
    await expect(page.getByRole('link', { name: 'Voir sur la carte' })).toBeVisible();
  });
});

test.describe('liste campagnes', () => {
  test('rend la page liste avec le titre et le CTA', async ({ page }) => {
    const reponse = await page.goto('/mobiliser/campagnes');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Campagnes' })).toBeVisible();
  });
});

test.describe('routes protégées', () => {
  test('/mobiliser/mobilisations/nouvelle redirige sans auth', async ({ page }) => {
    await page.goto('/mobiliser/mobilisations/nouvelle');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('/mobiliser/campagnes/nouvelle redirige sans auth', async ({ page }) => {
    await page.goto('/mobiliser/campagnes/nouvelle');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('/admin/moderation/mobilisations redirige sans auth', async ({ page }) => {
    await page.goto('/admin/moderation/mobilisations');
    await expect(page).toHaveURL(/^(?:.*\/connexion\?prochaine=|.*\/)$/);
  });

  test('/admin/moderation/campagnes redirige sans auth', async ({ page }) => {
    await page.goto('/admin/moderation/campagnes');
    await expect(page).toHaveURL(/^(?:.*\/connexion\?prochaine=|.*\/)$/);
  });
});

test.describe('fiches détail introuvables', () => {
  test('mobilisation slug inconnu → 404', async ({ page }) => {
    const reponse = await page.goto('/mobiliser/mobilisations/slug-inexistant-xyz');
    expect(reponse?.status()).toBe(404);
  });

  test('campagne slug inconnu → 404', async ({ page }) => {
    const reponse = await page.goto('/mobiliser/campagnes/slug-inexistant-xyz');
    expect(reponse?.status()).toBe(404);
  });
});

test.describe('carte unifiée', () => {
  test('rend la page /carte sans erreur', async ({ page }) => {
    const reponse = await page.goto('/carte');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Carte des actions' })).toBeVisible();
  });

  test('affiche les filtres de type', async ({ page }) => {
    await page.goto('/carte');
    await expect(page.getByText(/Mobilisations \(/)).toBeVisible();
    await expect(page.getByText(/Communes libres \(/)).toBeVisible();
  });
});

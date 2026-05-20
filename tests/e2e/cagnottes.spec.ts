import { expect, test } from '@playwright/test';

/**
 * Tests E2E du sous-espace Cagnottes (chantier 3.3).
 *
 * Sans Supabase branchée + Stripe en mode mock, on cible :
 *   - rendu liste et onglets,
 *   - redirections auth,
 *   - 404 sur slug inexistant,
 *   - page mock Stripe accessible.
 */

test.describe('liste cagnottes', () => {
  test('rend la page avec onglets et CTA', async ({ page }) => {
    const reponse = await page.goto('/mobiliser/cagnottes');
    expect(reponse?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Cagnottes solidaires' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Toutes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ouvertes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Caisses de lutte' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cotisations' })).toBeVisible();
  });

  test('filtre par type via querystring', async ({ page }) => {
    await page.goto('/mobiliser/cagnottes?type=lutte');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Cagnottes solidaires' }),
    ).toBeVisible();
  });
});

test.describe('routes cagnottes protégées', () => {
  test('/mobiliser/cagnottes/nouvelle redirige sans auth', async ({ page }) => {
    await page.goto('/mobiliser/cagnottes/nouvelle');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('/admin/moderation/cagnottes redirige sans droit', async ({ page }) => {
    await page.goto('/admin/moderation/cagnottes');
    await expect(page).toHaveURL(/^(?:.*\/connexion\?prochaine=|.*\/)$/);
  });
});

test.describe('fiche détail introuvable', () => {
  test('slug inexistant → 404', async ({ page }) => {
    const reponse = await page.goto('/mobiliser/cagnottes/cagnotte-inexistante-zzz');
    expect(reponse?.status()).toBe(404);
  });
});

test.describe('page mock Stripe', () => {
  test('rend la page de paiement simulé', async ({ page }) => {
    const reponse = await page.goto('/dons/mock/cs_mock_confirme_test');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Paiement simulé' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Confirmer le paiement' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Annuler' })).toBeVisible();
  });
});

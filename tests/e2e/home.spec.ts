import { expect, test } from '@playwright/test';

/**
 * Tests E2E de la page d'accueil définitive (chantier 2.1).
 *
 * Couvrent :
 * - rendu du bloc titre (textes fixés par la spec §3)
 * - rendu des 4 unes empilées (en état vide pour l'instant)
 * - rendu du pré-footer compteurs
 * - rendu du header avec nav 5 espaces
 * - rendu du footer avec liens éditoriaux
 * - navigation vers chaque espace racine (qui rend une page stub)
 */

test.describe('page d’accueil (chantier 2.1)', () => {
  test('charge la home et affiche les éléments de titre fixés', async ({ page }) => {
    const reponse = await page.goto('/');
    expect(reponse?.status()).toBe(200);

    await expect(page.getByText('La plateforme citoyenne des 99 %').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Maintenant!' })).toBeVisible();
    await expect(
      page.getByText(/Pour une vie digne et heureuse pour tous et toutes/),
    ).toBeVisible();
  });

  test('affiche les 4 unes empilées en état d’attente', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Pétition en cours')).toBeVisible();
    await expect(page.getByText('Article éditorial')).toBeVisible();
    await expect(page.getByText('Mobilisation à venir')).toBeVisible();
    await expect(page.getByText('Cagnotte solidaire')).toBeVisible();
  });

  test('affiche les compteurs pré-footer (newsletter, membres, signataires)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Newsletter', { exact: true })).toBeVisible();
    await expect(page.getByText('Membres', { exact: true })).toBeVisible();
    await expect(page.getByText('Signataires', { exact: true })).toBeVisible();
  });

  test('affiche le header avec nav 5 espaces', async ({ page }) => {
    await page.goto('/');
    for (const libelle of ['S’informer', 'Mobiliser', 'S’entraider', 'Agir', 'Comprendre']) {
      await expect(page.getByRole('link', { name: libelle }).first()).toBeVisible();
    }
  });

  test('affiche le footer avec liens éditoriaux', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Qui sommes-nous' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Mentions légales' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Politique de confidentialité' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  test('navigue depuis le header vers chaque espace racine', async ({ page }) => {
    const cibles: Array<{ libelle: string; url: RegExp }> = [
      { libelle: 'S’informer', url: /\/s-informer$/ },
      { libelle: 'Mobiliser', url: /\/mobiliser$/ },
      { libelle: 'S’entraider', url: /\/s-entraider$/ },
      { libelle: 'Agir', url: /\/agir$/ },
      { libelle: 'Comprendre', url: /\/comprendre$/ },
    ];
    for (const { libelle, url } of cibles) {
      await page.goto('/');
      await page.getByRole('link', { name: libelle }).first().click();
      await expect(page).toHaveURL(url);
    }
  });

  test('navigue depuis le footer vers les pages éditoriales', async ({ page }) => {
    const cibles: Array<{ libelle: string; url: RegExp }> = [
      { libelle: 'Qui sommes-nous', url: /\/a-propos$/ },
      { libelle: 'Mentions légales', url: /\/mentions-legales$/ },
      { libelle: 'Politique de confidentialité', url: /\/confidentialite$/ },
      { libelle: 'Contact', url: /\/contact$/ },
    ];
    for (const { libelle, url } of cibles) {
      await page.goto('/');
      await page.getByRole('contentinfo').getByRole('link', { name: libelle }).click();
      await expect(page).toHaveURL(url);
    }
  });
});

test.describe('404', () => {
  test('affiche la page « Page introuvable » sur une URL inexistante', async ({ page }) => {
    const reponse = await page.goto('/cette-url-nexiste-pas');
    expect(reponse?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeVisible();
  });
});

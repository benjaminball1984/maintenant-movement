import { expect, test } from '@playwright/test';

/**
 * Tests E2E des pages d'authentification (chantier 1.2).
 *
 * Ces tests vérifient le **rendu** et la **validation côté client**.
 * Le flux d'inscription/connexion end-to-end nécessite une instance
 * Supabase live ; il sera couvert au moment où l'instance sera créée
 * (cf. MANIFEST chantier 1.2).
 */

test.describe('/inscription', () => {
  test('charge la page et affiche les champs obligatoires', async ({ page }) => {
    const reponse = await page.goto('/inscription');
    expect(reponse?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1, name: 'Créer mon compte' })).toBeVisible();

    for (const champ of ['Prénom', 'Nom', 'Pronom', 'Adresse email', 'Code postal']) {
      await expect(page.getByLabel(champ, { exact: false }).first()).toBeVisible();
    }
    await expect(page.getByLabel('Date de naissance')).toBeVisible();
    await expect(page.getByLabel('Mot de passe', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Créer mon compte' })).toBeVisible();
  });

  test('refuse une soumission avec champs vides', async ({ page }) => {
    await page.goto('/inscription');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();
    // Au moins le message de prénom doit apparaître (premier champ requis).
    await expect(page.getByText('Le prénom est requis.')).toBeVisible();
  });

  test('refuse une personne de moins de 15 ans', async ({ page }) => {
    await page.goto('/inscription');
    // On utilise les id directement : `getByLabel('Nom')` matcherait aussi
    // « Prénom » et « Pronom » qui contiennent le sous-mot « nom ».
    await page.locator('#ins-prenom').fill('Camille');
    await page.locator('#ins-nom').fill('Ball');
    await page.locator('#ins-pronom').fill('iel');
    await page.locator('#ins-email').fill('camille@exemple.fr');
    await page.locator('#ins-code-postal').fill('75011');
    // 10 ans : refus attendu.
    const ilYa10Ans = new Date();
    ilYa10Ans.setFullYear(ilYa10Ans.getFullYear() - 10);
    await page.locator('#ins-date-naissance').fill(ilYa10Ans.toISOString().slice(0, 10));
    await page.locator('#ins-mdp').fill('MonMotDePasse1');
    await page.locator('#ins-cgu').check();
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    await expect(page.getByText(/15 ans révolus minimum/)).toBeVisible();
  });

  test('a un lien vers /connexion', async ({ page }) => {
    await page.goto('/inscription');
    await page.getByRole('link', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/connexion$/);
  });
});

test.describe('/connexion', () => {
  test('charge la page et affiche les 4 portes', async ({ page }) => {
    const reponse = await page.goto('/connexion');
    expect(reponse?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1, name: 'Se connecter' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Mot de passe' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Lien magique par email' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Comptes existants' })).toBeVisible();

    // OAuth GAFAM : 3 boutons cliquables.
    for (const provider of ['Google', 'Apple', 'Microsoft']) {
      await expect(
        page.getByRole('button', { name: new RegExp(`Continuer avec ${provider}`) }),
      ).toBeVisible();
    }
    // OAuth éthique : 3 boutons mais désactivés.
    for (const provider of ['Mastodon', 'Framasoft', 'Solid']) {
      const bouton = page.getByRole('button', { name: new RegExp(`${provider} \\(bientôt\\)`) });
      await expect(bouton).toBeVisible();
      await expect(bouton).toBeDisabled();
    }
  });

  test('a un lien vers /inscription', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByRole('link', { name: 'Créer un compte' }).click();
    await expect(page).toHaveURL(/\/inscription$/);
  });
});

test('/verifier-email charge et affiche le message', async ({ page }) => {
  const reponse = await page.goto('/verifier-email');
  expect(reponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Vérifie ton email' })).toBeVisible();
});

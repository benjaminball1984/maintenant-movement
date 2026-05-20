import { expect, test } from '@playwright/test';

/**
 * Tests E2E du sous-espace S'entraider (chantier 4.1).
 *
 * 4 sous-espaces (hebergement, transport, qui-prete-tout, fruits-de-la-terre)
 * + leurs pages de création + fiche détail commune.
 */

const SOUS_ESPACES = [
  { slug: 'hebergement', titre: 'Hébergement solidaire' },
  { slug: 'transport', titre: 'Transport solidaire' },
  { slug: 'qui-prete-tout', titre: 'Qui prête tout' },
  { slug: 'fruits-de-la-terre', titre: 'Fruits de la terre' },
];

for (const { slug, titre } of SOUS_ESPACES) {
  test.describe(`/s-entraider/${slug}`, () => {
    test('rend la page liste', async ({ page }) => {
      const reponse = await page.goto(`/s-entraider/${slug}`);
      expect(reponse?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: titre })).toBeVisible();
    });

    test('redirige sans auth vers /connexion', async ({ page }) => {
      await page.goto(`/s-entraider/${slug}/nouvelle`);
      await expect(page).toHaveURL(/\/connexion\?prochaine=/);
    });
  });
}

test.describe("page d'accueil S'entraider", () => {
  test('rend les 4 sous-espaces actifs', async ({ page }) => {
    await page.goto('/s-entraider');
    for (const { titre } of SOUS_ESPACES) {
      await expect(page.getByText(titre).first()).toBeVisible();
    }
  });
});

test.describe('fiche offre introuvable', () => {
  test('slug inexistant → 404', async ({ page }) => {
    const reponse = await page.goto('/s-entraider/offre/offre-inexistante-zzz');
    expect(reponse?.status()).toBe(404);
  });
});

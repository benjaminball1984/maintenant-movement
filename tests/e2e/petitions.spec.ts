import { expect, test } from '@playwright/test';

/**
 * Tests E2E du sous-espace Pétitions (chantier 3.1).
 *
 * En l'absence d'instance Supabase live, les tests ciblent surtout :
 *   - le rendu de la liste en état vide (aucune pétition publiée) ;
 *   - la protection auth des pages création + modération ;
 *   - l'accès direct à la page index est sans erreur.
 *
 * Les flux complets « créer → modérer → publier → signer » nécessitent
 * la BDD branchée et seront ajoutés dans le scénario d'intégration
 * une fois la migration appliquée.
 */

test.describe('liste pétitions (chantier 3.1)', () => {
  test('affiche la page liste avec son titre et son CTA', async ({ page }) => {
    const reponse = await page.goto('/mobiliser/petitions');
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Pétitions' })).toBeVisible();
    // En état vide (aucune pétition publiée), une alerte d'attente
    // s'affiche. En état rempli, des cartes s'affichent à la place.
    // On vérifie au moins que l'un des deux est présent.
    const alerte = page.getByText('Aucune pétition active pour le moment');
    const cartes = page.locator('[data-testid="compteur-stretch"]');
    await expect(alerte.or(cartes.first())).toBeVisible();
  });

  test('le CTA création pointe vers /mobiliser/petitions/nouvelle', async ({ page }) => {
    await page.goto('/mobiliser/petitions');
    const lien = page.getByRole('link', {
      name: /Lancer une pétition|Connecte-toi pour lancer une pétition/,
    });
    await expect(lien).toHaveAttribute('href', '/mobiliser/petitions/nouvelle');
  });
});

test.describe('routes pétitions protégées', () => {
  test('/mobiliser/petitions/nouvelle redirige vers /connexion sans auth', async ({ page }) => {
    await page.goto('/mobiliser/petitions/nouvelle');
    await expect(page).toHaveURL(/\/connexion\?prochaine=/);
  });

  test('/admin/moderation/petitions redirige sans auth', async ({ page }) => {
    await page.goto('/admin/moderation/petitions');
    // Soit on est renvoyé vers /connexion, soit (cas où une session
    // sans droits existe) on est ramené à /. Les deux sont des sorties
    // attendues d'un accès non autorisé.
    await expect(page).toHaveURL(/^(?:.*\/connexion\?prochaine=|.*\/)$/);
  });
});

test.describe('fiche pétition introuvable', () => {
  test('renvoie une 404 pour un slug inexistant', async ({ page }) => {
    const reponse = await page.goto('/mobiliser/petitions/slug-inexistant-xyz');
    expect(reponse?.status()).toBe(404);
  });
});

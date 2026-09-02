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

/**
 * Appel « Faisons Front par la Rue ! » (V2.6.134).
 *
 * L'appel est une pétition portant le drapeau « est_appel » : même objet,
 * habillage différent. Ces tests vérifient que l'habillage est bien celui d'un
 * appel (surtitre, auteur collectif, bouton) et que la fenêtre de signature
 * bascule au nom d'une organisation, avec ses champs propres.
 *
 * Ils tolèrent l'absence de la ligne en base (environnement CI avec base
 * bouchonnée) : la page renvoie alors 404 et le test se saute, plutôt que
 * d'échouer pour une raison qui n'est pas un bug de code.
 */
test.describe('appel ouvert à la signature', () => {
  const CHEMIN_APPEL = '/mobiliser/petitions/faisons-front-par-la-rue';

  test('affiche l’appel avec son surtitre et son auteur collectif', async ({ page }) => {
    const reponse = await page.goto(CHEMIN_APPEL);
    test.skip(reponse?.status() === 404, 'appel absent de cette base');
    expect(reponse?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Faisons Front par la Rue');
    await expect(page.getByText('Appel ouvert à la signature').first()).toBeVisible();
    await expect(page.getByText('Texte proposé par')).toBeVisible();
    // Un appel n'affiche pas de jauge d'objectif chiffré.
    await expect(page.locator('[data-testid="compteur-stretch"]')).toHaveCount(0);
    // Le bloc des organisations signataires est toujours présent sur un appel.
    await expect(page.getByRole('heading', { name: /Organisations signataires/ })).toBeVisible();
  });

  test('l’adresse courte /appel redirige vers la fiche de l’appel', async ({ page }) => {
    const reponse = await page.goto('/appel');
    expect(reponse?.status()).toBe(200);

    // On ne reste jamais sur /appel : c'est un raccourci, pas une page.
    // Sans appel publié (base bouchonnée en CI), le repli est la liste des
    // pétitions — jamais une impasse.
    await expect(page).toHaveURL(/\/mobiliser\/petitions(\/[a-z0-9-]+)?$/);

    if (/\/mobiliser\/petitions\/[a-z0-9-]+$/.test(page.url())) {
      await expect(page.getByText('Appel ouvert à la signature').first()).toBeVisible();
    }
  });

  test('la fenêtre de signature bascule au nom d’une organisation', async ({ page }) => {
    const reponse = await page.goto(CHEMIN_APPEL);
    test.skip(reponse?.status() === 404, 'appel absent de cette base');

    await page.getByRole('button', { name: /Ouvrir la fenêtre de signature de l’appel/ }).click();

    // La page contient plusieurs `<dialog>` (signature, invitation de
    // contacts...) : on cible celui de la signature par son libellé.
    const dialogue = page.getByRole('dialog', { name: /Signer l’appel/ });
    await expect(dialogue).toBeVisible();

    // Par défaut : signature individuelle, aucun champ d'organisation.
    await expect(dialogue.locator('#sig-org-nom')).toHaveCount(0);

    await dialogue.getByText('Au nom d’une organisation').click();

    await expect(dialogue.locator('#sig-org-nom')).toBeVisible();
    await expect(dialogue.locator('#sig-org-categorie')).toBeVisible();
    // La case d'affichage public est cochée d'office : c'est le sens même
    // d'une co-signature d'appel.
    await expect(dialogue.locator('#sig-org-public')).toBeChecked();
    await expect(
      dialogue.getByRole('button', { name: 'Signer au nom de l’organisation' }),
    ).toBeVisible();
  });
});

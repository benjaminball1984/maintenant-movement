import { expect, test } from '@playwright/test';

/**
 * Tests E2E des pages /profil/* (chantier 1.3).
 *
 * En l'absence d'instance Supabase live, ces tests vérifient surtout
 * que :
 * - les pages protégées redirigent vers `/connexion?prochaine=...`
 *   quand on n'est pas authentifié·e ;
 * - le paramètre `prochaine` est correctement encodé.
 *
 * Le rendu interne (avec une session live) sera vérifié manuellement
 * dès que Supabase sera branché.
 */

const PAGES_PROTEGEES = [
  '/profil',
  '/profil/dashboard',
  '/profil/informations',
  '/profil/communes',
  '/profil/contributions',
  '/profil/notifications',
  '/profil/wallet',
  '/profil/confidentialite',
  '/profil/securite/2fa',
] as const;

test.describe('routes /profil/* protégées', () => {
  for (const chemin of PAGES_PROTEGEES) {
    test(`${chemin} redirige vers /connexion sans auth`, async ({ page }) => {
      const reponse = await page.goto(chemin);
      // Soit on est arrivé sur /connexion, soit le statut est OK
      // (mais l'URL finale doit être /connexion avec `?prochaine=...`).
      expect(reponse?.status()).toBeLessThan(400);
      await expect(page).toHaveURL(/\/connexion\?prochaine=/);
    });
  }

  test('le paramètre `prochaine` est URL-encodé', async ({ page }) => {
    await page.goto('/profil/securite/2fa');
    await expect(page).toHaveURL(/\/connexion\?prochaine=%2Fprofil%2Fsecurite%2F2fa/);
  });
});

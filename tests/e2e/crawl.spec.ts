import { expect, test } from '@playwright/test';

/**
 * Test « pas de lien mort ».
 *
 * Crawl naïf en un saut : récupère tous les liens internes visibles depuis
 * `/`, les suit, et vérifie qu'aucun ne renvoie un statut HTTP >= 400.
 *
 * Garde-fou demandé par CLAUDE.md §8.5 : un seul lien mort = build rouge
 * = chantier non terminé. Le crawl s'élargira au fil des chantiers (suivre
 * les liens transitivement, soumettre les formulaires, etc.).
 */
test('aucun lien interne mort depuis la home', async ({ page, request }) => {
  await page.goto('/');

  const cibles = await page.$$eval('a[href]', (liens) =>
    liens
      .map((l) => l.getAttribute('href'))
      .filter((href): href is string => href !== null)
      .filter((href) => href.startsWith('/') && !href.startsWith('//'))
      .map((href) => href.split('#')[0] ?? href),
  );

  const cibleUniques = Array.from(new Set(cibles));
  expect(cibleUniques.length).toBeGreaterThan(0);

  for (const chemin of cibleUniques) {
    const reponse = await request.get(chemin);
    expect(
      reponse.status(),
      `Lien mort détecté : ${chemin} renvoie ${reponse.status()}`,
    ).toBeLessThan(400);
  }
});

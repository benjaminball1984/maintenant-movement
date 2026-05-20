import { expect, test } from '@playwright/test';

test.describe("D'autres moyens d'agir", () => {
  test('rend /agir/autres-moyens', async ({ page }) => {
    const reponse = await page.goto('/agir/autres-moyens');
    expect(reponse?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: "D'autres moyens d'agir" }),
    ).toBeVisible();
  });

  test('affiche la note de distance protectrice', async ({ page }) => {
    await page.goto('/agir/autres-moyens');
    await expect(page.getByText('Distance protectrice')).toBeVisible();
  });
});

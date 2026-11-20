import { expect, test } from '@playwright/test';

test('start screen: switching modes and moving the slider updates the total', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Morgenroutine' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Erweitert' })).toHaveAttribute('aria-checked', 'true');

  const total = page.locator('.total');
  await expect(total).toHaveText('≈ 18 min gesamt');

  const slider = page.getByRole('slider', { name: 'Grunddauer' });
  await slider.fill('30');
  await expect(total).toHaveText('≈ 13 min gesamt');

  await page.getByRole('radio', { name: 'Original' }).click();
  await expect(page.locator('.slider-label')).toHaveText('Sekunden pro Übung');
  await expect(total).toHaveText('≈ 10 min gesamt');

  await page.getByRole('radio', { name: 'Blutdruck' }).click();
  await expect(slider).toBeHidden();
  await expect(total).toHaveText('14 min, fest nach Studienprotokoll');
});

test('settings survive a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Kurz' }).click();
  await page.getByRole('slider', { name: 'Grunddauer' }).fill('45');
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Kurz' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.slider-value')).toHaveText('45 s');
});

test('routine runs: first step, transition preview, second step', async ({ page }) => {
  // 30-fache Geschwindigkeit: 30 s Übung ≈ 1 s, 5 s Wechselpause ≈ 0,17 s
  await page.goto('/?speed=30');
  await page.getByRole('radio', { name: 'Original' }).click();
  await page.getByRole('slider', { name: 'Grunddauer' }).fill('30');
  await page.getByRole('button', { name: 'Start' }).click();

  await expect(page.locator('.progress-count')).toHaveText('1 / 9');
  await expect(page.locator('.exercise-name')).toHaveText('Lymphatic Hops');
  await expect(page.locator('svg.figure')).toBeVisible();

  await expect(page.locator('.progress-count')).toHaveText('2 / 9', { timeout: 5_000 });
  await expect(page.locator('.exercise-name')).toHaveText('Body Wave');

  await page.getByRole('button', { name: 'Routine beenden' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Beenden' }).click();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
});

test('navigation: next/previous buttons and the "Nächste" label', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Original' }).click();
  await page.getByRole('button', { name: 'Start' }).click();

  await expect(page.locator('.next-label')).toHaveText('Nächste: Body Wave');
  await page.getByRole('button', { name: 'Nächste Übung' }).click();
  await expect(page.locator('.exercise-name')).toHaveText('Body Wave');
  await expect(page.locator('.next-label')).toHaveText('Nächste: Arm Swings');

  // innerhalb der ersten 3 s: zurück zur vorherigen Übung
  await page.getByRole('button', { name: 'Vorherige Übung' }).click();
  await expect(page.locator('.exercise-name')).toHaveText('Lymphatic Hops');

  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Nächste Übung' }).click();
  await expect(page.locator('.exercise-name')).toHaveText('Horse Stance');
  await expect(page.getByRole('button', { name: 'Nächste Übung' })).toBeDisabled();
  await expect(page.locator('.next-label')).toHaveText('Letzte Übung');
});

test('stopping asks for confirmation and pauses meanwhile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Original' }).click();
  await page.getByRole('button', { name: 'Start' }).click();

  await page.getByRole('button', { name: 'Routine beenden' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Routine beenden?' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.paused-banner')).toBeVisible();
  const frozen = await page.locator('.countdown').textContent();
  await page.waitForTimeout(1500);
  await expect(page.locator('.countdown')).toHaveText(frozen ?? '');

  // Weitermachen: Dialog zu, Routine läuft wieder
  await dialog.getByRole('button', { name: 'Weitermachen' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  // War vorher pausiert, bleibt es nach „Weitermachen“ pausiert
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Routine beenden' }).click();
  await dialog.getByRole('button', { name: 'Weitermachen' }).click();
  await expect(page.getByRole('button', { name: 'Fortsetzen' })).toBeVisible();

  await page.getByRole('button', { name: 'Routine beenden' }).click();
  await dialog.getByRole('button', { name: 'Beenden' }).click();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
});

test('PWA: manifest and service worker are served', async ({ page }) => {
  await page.goto('/');
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({ name: 'Morgenroutine', display: 'standalone' });
  const registered = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return Boolean(reg.active);
  });
  expect(registered).toBe(true);
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Seite einmal unter Kontrolle des Service Workers laden, dann offline neu laden
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Morgenroutine' })).toBeVisible();
  await context.setOffline(false);
});

test('no horizontal scrolling at 360 px, portrait and landscape', async ({ page }) => {
  const noOverflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/?speed=30');
  await page.locator('.steps summary').click();
  expect(await noOverflow()).toBe(true);
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.countdown')).toBeVisible();
  expect(await noOverflow()).toBe(true);

  await page.setViewportSize({ width: 740, height: 360 });
  expect(await noOverflow()).toBe(true);
});

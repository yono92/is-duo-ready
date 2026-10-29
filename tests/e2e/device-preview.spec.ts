import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };

test.skip(
  !existsSync(join(process.cwd(), 'assets', 'development', 'iphone-duo-render.png')),
  'The interactive prototype requires the optional local-only device asset.',
);

async function dragEdge(page: Page, handle: Locator, distance: number) {
  await expect(handle).toBeVisible();
  // Reset/rotation can move the projected grip on the next WebGL frame.
  await handle.hover();
  const bounds = (await handle.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  const dx = Number(await handle.getAttribute('data-drag-x'));
  const dy = Number(await handle.getAttribute('data-drag-y'));
  expect(Math.hypot(dx, dy)).toBeCloseTo(1, 1);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx * distance, y + dy * distance, { steps: 6 });
  await page.mouse.up();
}

for (const [locale, messages] of Object.entries({ ko, en })) {
  test(`WebGL device edge controls, rotation and reset in ${locale}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${locale}`);
    const t = messages.DevicePreview;
    const stage = page.getByRole('group', { name: t.label });
    const model = page.getByTestId('device-model');
    const leftEdge = page.getByRole('slider', { name: t.leftEdge });
    const rightEdge = page.getByRole('slider', { name: t.rightEdge });
    await expect(model).toHaveAttribute('data-status', 'ready', { timeout: 30000 });
    await expect(model.locator('canvas')).toBeVisible();
    await expect(page.getByRole('slider')).toHaveCount(2);
    await expect(leftEdge).toHaveAttribute('aria-valuenow', '150');
    await expect(rightEdge).toHaveAttribute('aria-valuenow', '150');
    await expect(
      page.getByRole('button', { name: locale === 'ko' ? '접기' : 'Fold', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: locale === 'ko' ? '펼치기' : 'Unfold', exact: true }),
    ).toHaveCount(0);

    await stage.focus();
    await page.keyboard.press('ArrowRight');
    await expect(model).toHaveAttribute('data-yaw', '-1');
    await page.keyboard.press('ArrowDown');
    await expect(model).toHaveAttribute('data-pitch', '18');
    await page.keyboard.press('ArrowUp');
    await expect(model).toHaveAttribute('data-pitch', '8');
    await page.keyboard.press('Home');
    await expect(model).toHaveAttribute('data-yaw', '-16');

    const bounds = (await stage.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 40, bounds.y + bounds.height / 2 + 35, {
      steps: 6,
    });
    await page.mouse.up();
    await expect
      .poll(async () => Number(await model.getAttribute('data-pitch')))
      .toBeGreaterThan(8);
    await expect
      .poll(async () => Number(await model.getAttribute('data-yaw')))
      .toBeGreaterThan(-16);
    await expect(stage).toHaveAttribute('data-dragging', 'false');
    await expect(model).toHaveAttribute('data-angle', '150');
    await page.getByRole('button', { name: t.reset, exact: true }).click();

    // Slider semantics belong to the direct edge handles, without separate form controls.
    await leftEdge.focus();
    await page.keyboard.press('Home');
    await expect(model).toHaveAttribute('data-angle', '0');
    await expect(rightEdge).toHaveAttribute('aria-valuenow', '0');
    await page.keyboard.press('ArrowRight');
    await expect(leftEdge).toHaveAttribute('aria-valuenow', '5');
    await page.keyboard.press('End');
    await expect(rightEdge).toHaveAttribute('aria-valuenow', '180');
    await expect(model).toHaveAttribute('data-yaw', '-16');
    await expect(model).toHaveAttribute('data-pitch', '8');

    // Compare actual canvas pixels, excluding handle focus/DOM changes.
    const openImage = await model
      .locator('canvas')
      .screenshot({ path: `test-results/device-${locale}-webgl.png` });
    await rightEdge.focus();
    await page.keyboard.press('Home');
    const foldedImage = await model
      .locator('canvas')
      .screenshot({ path: `test-results/device-${locale}-folded.png` });
    expect(foldedImage.equals(openImage)).toBe(false);
    await page.keyboard.press('End');
    await stage.focus();
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
    await stage.screenshot({ path: `test-results/device-${locale}-back.png` });
    const result = await new AxeBuilder({ page })
      .include('figure')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.getByRole('button', { name: t.reset, exact: true }).click();
    await expect(model).toHaveAttribute('data-yaw', '-16');
    await expect(model).toHaveAttribute('data-pitch', '8');
    await expect(model).toHaveAttribute('data-angle', '150');
    expect(errors).toEqual([]);
  });
}

test('both edges fold inward, reopen when closed and retain capture outside the model', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  const model = page.getByTestId('device-model');
  const stage = page.getByRole('group', { name: en.DevicePreview.label });
  await expect(model).toHaveAttribute('data-status', 'ready', { timeout: 30000 });
  for (const label of [en.DevicePreview.leftEdge, en.DevicePreview.rightEdge]) {
    await page.getByRole('button', { name: en.DevicePreview.reset, exact: true }).click();
    const handle = page.getByRole('slider', { name: label });
    await dragEdge(page, handle, -35);
    await expect.poll(async () => Number(await model.getAttribute('data-angle'))).toBeLessThan(150);
    await expect(model).toHaveAttribute('data-yaw', '-16');
    await expect(model).toHaveAttribute('data-pitch', '8');
    // Carry the gesture past the opposite edge of the device before releasing.
    await dragEdge(page, handle, -230);
    await expect(handle).toHaveAttribute('aria-valuenow', '0');
    await dragEdge(page, handle, 50);
    await expect
      .poll(async () => Number(await model.getAttribute('data-angle')))
      .toBeGreaterThan(0);
    const releasedAngle = await model.getAttribute('data-angle');
    await page.mouse.move(20, 20);
    await expect(model).toHaveAttribute('data-angle', releasedAngle!);
  }
  // Turning the model around swaps screen sides; inward still means fold.
  await page.getByRole('button', { name: en.DevicePreview.reset, exact: true }).click();
  await stage.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
  await expect(model).toHaveAttribute('data-yaw', '164');
  await dragEdge(page, page.getByRole('slider', { name: en.DevicePreview.rightEdge }), -45);
  await expect.poll(async () => Number(await model.getAttribute('data-angle'))).toBeLessThan(150);
  await expect(model).toHaveAttribute('data-yaw', '164');
});

test('touch supports vertical rotation and edge folding without viewport overflow', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto('/ko');
  const stage = page.getByRole('group', { name: ko.DevicePreview.label });
  const model = page.getByTestId('device-model');
  await expect(model).toHaveAttribute('data-status', 'ready', { timeout: 30000 });
  const bounds = (await stage.boundingBox())!;
  const session = await context.newCDPSession(page);
  const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: point.x + 35, y: point.y + 45 }],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => Number(await model.getAttribute('data-pitch'))).toBeGreaterThan(8);
  await expect.poll(async () => Number(await model.getAttribute('data-yaw'))).toBeGreaterThan(-16);
  await expect(stage).toHaveAttribute('data-dragging', 'false');
  await page.getByRole('button', { name: ko.DevicePreview.reset, exact: true }).click();
  const handle = page.getByRole('slider', { name: ko.DevicePreview.rightEdge });
  const edge = (await handle.boundingBox())!;
  const edgePoint = { x: edge.x + edge.width / 2, y: edge.y + edge.height / 2 };
  const dx = Number(await handle.getAttribute('data-drag-x'));
  const dy = Number(await handle.getAttribute('data-drag-y'));
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [edgePoint] });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: edgePoint.x - dx * 50, y: edgePoint.y - dy * 50 }],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => Number(await model.getAttribute('data-angle'))).toBeLessThan(150);
  await expect(model).toHaveAttribute('data-pitch', '8');
  await expect(model).toHaveAttribute('data-yaw', '-16');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/device-mobile-webgl.png' });
  await context.close();
});

test('a lost WebGL context restores the image and disables 3D controls', async ({ page }) => {
  await page.goto('/en');
  const model = page.getByTestId('device-model');
  await expect(model).toHaveAttribute('data-status', 'ready', { timeout: 30000 });
  await model.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(model).toHaveAttribute('data-status', 'unavailable');
  await expect(page.getByAltText(en.DevicePreview.fallbackAlt)).toBeVisible();
  const handles = page.locator('figure [role="slider"]');
  await expect(handles).toHaveCount(2);
  for (const handle of await handles.all())
    await expect(handle).toHaveAttribute('aria-disabled', 'true');
  await expect(
    page.getByRole('button', { name: en.DevicePreview.reset, exact: true }),
  ).toBeDisabled();
});

test('screen blur follows edge folding, clears at rest and respects reduced motion', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Observe values actually uploaded to the GPU, not a duplicate UI animation state.
  await page.addInitScript(() => {
    const samples: number[] = [];
    Object.assign(window, { duoBlurSamples: samples });
    const names = new WeakMap<WebGLUniformLocation, string>();
    const originalLocation = WebGL2RenderingContext.prototype.getUniformLocation;
    const originalUniform = WebGL2RenderingContext.prototype.uniform1f;
    WebGL2RenderingContext.prototype.getUniformLocation = function (program, name) {
      const location = originalLocation.call(this, program, name);
      if (location) names.set(location, name);
      return location;
    };
    WebGL2RenderingContext.prototype.uniform1f = function (location, value) {
      if (location && names.get(location) === 'duoFoldBlur') samples.push(value);
      return originalUniform.call(this, location, value);
    };
  });
  const samples = () =>
    page.evaluate(() => (window as unknown as { duoBlurSamples: number[] }).duoBlurSamples);
  const clearSamples = () =>
    page.evaluate(() => {
      (window as unknown as { duoBlurSamples: number[] }).duoBlurSamples.length = 0;
    });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/en');
  await expect(page.getByTestId('device-model')).toHaveAttribute('data-status', 'ready', {
    timeout: 30000,
  });
  await expect.poll(samples).toContain(0);
  expect((await samples()).every((value) => value === 0)).toBe(true);
  const stage = page.getByRole('group', { name: en.DevicePreview.label });
  const handle = page.getByRole('slider', { name: en.DevicePreview.rightEdge });
  for (const [key, label] of [
    ['Home', 'fold'],
    ['End', 'unfold'],
  ] as const) {
    await clearSamples();
    await handle.focus();
    await page.keyboard.press(key);
    await expect.poll(async () => Math.max(...(await samples()))).toBeGreaterThan(4);
    await stage.screenshot({ path: `test-results/device-blur-${label}.png` });
    await expect.poll(async () => (await samples()).at(-1), { timeout: 10000 }).toBe(0);
  }
  await clearSamples();
  await dragEdge(page, handle, -60);
  await expect.poll(async () => Math.max(...(await samples()))).toBeGreaterThan(4);
  await expect.poll(async () => (await samples()).at(-1), { timeout: 10000 }).toBe(0);
  await stage.screenshot({ path: 'test-results/device-blur-settled.png' });
  await clearSamples();
  await stage.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  expect((await samples()).every((value) => value === 0)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await clearSamples();
  await handle.focus();
  await page.keyboard.press('Home');
  await expect(page.getByTestId('device-model')).toHaveAttribute('data-angle', '0');
  await stage.screenshot();
  expect((await samples()).every((value) => value === 0)).toBe(true);
  expect(errors).toEqual([]);
});

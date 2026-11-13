import { expect, test } from '@playwright/test';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import { fieldName } from './select-option';
import { waitForDevice } from './wait-for-device';

for (const locale of ['ko', 'en']) {
  test(`home offers one search before the directory and an optional screen guide in ${locale}`, async ({
    page,
  }) => {
    const messages = locale === 'ko' ? ko : en;
    await page.goto(`/${locale}`);

    const search = page.getByRole('searchbox', { name: messages.Directory.search, exact: true });
    await expect(page.getByRole('searchbox')).toHaveCount(1);
    await expect(search).toBeInViewport();
    const directory = page.getByRole('heading', { name: messages.Nav.explore, exact: true });
    await expect(directory).toBeVisible();
    await expect
      .poll(async () => {
        const [searchBounds, marqueeBounds, directoryBounds] = await Promise.all([
          search.boundingBox(),
          page.getByTestId('app-marquee').boundingBox(),
          directory.boundingBox(),
        ]);
        return (
          searchBounds !== null &&
          marqueeBounds !== null &&
          directoryBounds !== null &&
          searchBounds.y + searchBounds.height <= marqueeBounds.y &&
          marqueeBounds.y + marqueeBounds.height <= directoryBounds.y
        );
      })
      .toBe(true);

    await waitForDevice(page);
    await page.screenshot({ path: `test-results/home-top-${locale}.png`, animations: 'disabled' });

    const guide = page.getByRole('region', {
      name: messages.HomeInsights.guideTitle,
      exact: true,
    });
    const disclosure = guide.getByRole('button', { name: messages.HomeInsights.guideTitle });
    const fullDisplay = guide.getByRole('heading', {
      name: messages.HomeInsights.fullTitle,
      exact: true,
    });
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await expect(fullDisplay).toBeHidden();
    await disclosure.focus();
    await disclosure.press('Enter');
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(guide.getByRole('heading', { level: 3 })).toHaveText([
      messages.HomeInsights.centeredTitle,
      messages.HomeInsights.expandedTitle,
      messages.HomeInsights.fullTitle,
    ]);
    await expect(fullDisplay).toBeVisible();
    await expect(guide.getByText(messages.HomeInsights.guideNote, { exact: true })).toBeVisible();
    await expect(
      guide.getByRole('link', { name: messages.HomeInsights.guideSource, exact: true }),
    ).toHaveAttribute('href', 'https://developer.apple.com/iphone-duo/prepare/');
    await guide.screenshot({ path: `test-results/home-guide-${locale}.png` });

    // Fixture apps have no real public support history to preview.
    await expect(
      page.getByRole('heading', { name: messages.HomeInsights.updatesTitle, exact: true }),
    ).toHaveCount(0);
  });
}

test('hero search resets pagination while preserving selected filters and sorting', async ({
  page,
}) => {
  await page.goto('/ko?sort=name&page=2');
  await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2');
  const search = page.getByRole('searchbox', { name: ko.Directory.search, exact: true });
  await search.fill('메모');
  await search.press('Enter');
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('q') === '메모' &&
      url.searchParams.get('sort') === 'name' &&
      !url.searchParams.has('page'),
  );
  await expect(page.getByTestId('app-card')).toHaveCount(1);
  await expect(page.getByTestId('app-card')).toContainText('종이숲');

  await page.goto('/ko?category=graphics-design&status=unsupported&sort=name');
  await search.fill('형태연구');
  await page.getByRole('button', { name: ko.Directory.searchButton, exact: true }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('q') === '형태연구' &&
      url.searchParams.get('category') === 'graphics-design' &&
      url.searchParams.get('status') === 'unsupported' &&
      url.searchParams.get('sort') === 'name' &&
      !url.searchParams.has('page'),
  );
  await expect(page.getByTestId('app-card')).toHaveCount(1);
  await expect(page.getByTestId('app-card')).toContainText('형태연구');
  await expect(
    page
      .getByRole('group', { name: ko.Directory.status, exact: true })
      .getByRole('button', { name: ko.Status.unsupported, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: ko.Categories['graphics-design'], exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', { name: fieldName(ko.Directory.sort) })).toContainText(
    ko.Directory.name,
  );
});

test('app marquee can be paused and resumed from the keyboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/ko');
  const marquee = page.getByTestId('app-marquee');
  await expect(marquee).toBeVisible();
  // Hover also pauses the rows; keep the pointer outside while testing the control.
  await page.mouse.move(0, 0);
  const animationStates = () =>
    marquee.evaluate((element) =>
      element.getAnimations({ subtree: true }).map((animation) => animation.playState),
    );
  await expect.poll(animationStates).toEqual(['running', 'running']);
  await page.getByRole('button', { name: ko.Home.pauseApps, exact: true }).focus();
  await page.keyboard.press('Enter');
  const resume = page.getByRole('button', { name: ko.Home.resumeApps, exact: true });
  await expect(resume).toBeFocused();
  await expect.poll(animationStates).toEqual(['paused', 'paused']);
  await resume.press('Enter');
  await expect(page.getByRole('button', { name: ko.Home.pauseApps, exact: true })).toBeFocused();
  await expect.poll(animationStates).toEqual(['running', 'running']);
});

test('reduced motion keeps the app marquee static and search available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  const marquee = page.getByTestId('app-marquee');
  await expect(marquee).toBeVisible();
  await expect
    .poll(() => marquee.evaluate((element) => element.getAnimations({ subtree: true }).length))
    .toBe(0);
  await expect(page.getByRole('button', { name: en.Home.pauseApps, exact: true })).toBeHidden();
  await expect(
    page.getByRole('searchbox', { name: en.Directory.search, exact: true }),
  ).toBeVisible();
});

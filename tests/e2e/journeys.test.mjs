import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../support/server.mjs';
import { loadPlaywright, axeSource, blockThirdParty } from '../support/browser.mjs';

const { chromium } = loadPlaywright();
let server;
let browser;

const PAGES = ['/', '/intelligence', '/intelligence/what-ai-is-made-of', '/intelligence/from-copper-to-compute',
  '/advisory', '/approach', '/about', '/projects', '/screen', '/assess', '/work-with-us', '/privacy', '/terms', '/no-such-page'];

before(async () => {
  server = await startServer();
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
  await server.close();
});

async function open(path, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', ...opts });
  await blockThirdParty(context);
  const page = await context.newPage();
  const res = await page.goto(server.url + path);
  return { context, page, res };
}

test('home reaches both research experiences in one activation, and their briefs', async () => {
  const { context, page } = await open('/');
  const hrefs = await page.$$eval('#intelligence a', (as) => as.map((a) => a.getAttribute('href')));
  for (const h of ['https://ai.sidmofya.com/', 'https://ai.sidmofya.com/copper/',
    '/intelligence/what-ai-is-made-of', '/intelligence/from-copper-to-compute']) {
    assert.ok(hrefs.includes(h), h);
  }
  // The first substantial section after the hero is the research.
  const firstSection = await page.$eval('main > section:nth-of-type(2)', (s) => s.id);
  assert.equal(firstSection, 'intelligence');
  await page.click('text=Explore our intelligence');
  await page.waitForURL('**/intelligence');
  assert.equal(await page.textContent('h1'), 'Industrial intelligence, open to exploration.');
  await context.close();
});

test('each brief offers Explore and a context-specific inquiry that preselects the form', async () => {
  const cases = [
    ['/intelligence/what-ai-is-made-of', 'Discuss your infrastructure question', 'invest', 'What AI Is Made Of'],
    ['/intelligence/from-copper-to-compute', 'Discuss your value-chain question', 'position', 'From Copper to Compute']
  ];
  for (const [path, cta, decision, title] of cases) {
    const { context, page } = await open(path);
    assert.ok(await page.$('main a.btn:has-text("Explore")'), `${path} explore`);
    await page.click(`text=${cta}`);
    await page.waitForURL(/work-with-us\?/);
    assert.equal(await page.isChecked(`#bf-decision-${decision}`), true, `${path} preselects ${decision}`);
    const ctx = await page.textContent('#bf-context');
    assert.match(ctx, new RegExp(title));
    await context.close();
  }
});

test('legacy entry points still land correctly', async () => {
  const { context, page } = await open('/request-access?interest=kafwego');
  assert.match(page.url(), /\/work-with-us\?interest=kafwego$/);
  assert.equal(await page.isChecked('#bf-decision-project'), true);
  assert.match(await page.textContent('#bf-context'), /Kafwego Resources/);

  for (const [from, to] of [['/programs', '/assess'], ['/critical-minerals', '/projects#critical-minerals'], ['/decision-rooms.html', '/assess']]) {
    await page.goto(server.url + from);
    assert.ok(page.url().endsWith(to), `${from} -> ${page.url()}`);
  }
  await page.goto(server.url + '/intelligence.html');
  assert.equal(await page.textContent('h1'), 'Industrial intelligence, open to exploration.');
  await context.close();
});

test('unknown paths return a real 404 with useful links', async () => {
  const { context, page, res } = await open('/no-such-page');
  assert.equal(res.status(), 404);
  assert.equal(await page.textContent('h1'), 'This page does not exist.');
  assert.ok(await page.$('a[href="/intelligence"]'));
  assert.ok(await page.$('a[href="/work-with-us"]'));
  await context.close();
});

test('keyboard: skip link first, then the primary navigation', async () => {
  const { context, page } = await open('/');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.match(page.url(), /#main$/);
  const order = [];
  await page.goto(server.url + '/');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => document.activeElement.getAttribute('href') || document.activeElement.id));
  }
  assert.deepEqual(order, ['#main', '/', '/intelligence', '/advisory', '/about', '/work-with-us']);
  await context.close();
});

test('mobile navigation: collapses, opens, closes with Escape and returns focus', async () => {
  const { context, page } = await open('/', { viewport: { width: 390, height: 844 } });
  assert.equal(await page.isVisible('#nav-menu'), false);
  await page.focus('#nav-toggle');
  await page.keyboard.press('Enter');
  assert.equal(await page.getAttribute('#nav-toggle', 'aria-expanded'), 'true');
  assert.equal(await page.isVisible('#nav-menu a[href="/intelligence"]'), true);
  const box = await page.locator('#nav-menu a[href="/advisory"]').boundingBox();
  assert.ok(box.height >= 44, `nav link target ${box.height}px`);
  await page.keyboard.press('Escape');
  assert.equal(await page.getAttribute('#nav-toggle', 'aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'nav-toggle');
  await context.close();
});

test('no horizontal scrolling at 320px, 390px or 200% zoom (640px)', async () => {
  for (const width of [320, 390, 640]) {
    const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    await blockThirdParty(context);
    const page = await context.newPage();
    for (const path of PAGES) {
      await page.goto(server.url + path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `${path} at ${width}px overflows by ${overflow}px`);
    }
    await context.close();
  }
});

test('content is complete without JavaScript', async () => {
  const { context, page } = await open('/', { javaScriptEnabled: false });
  assert.equal(await page.isVisible('text=What AI Is Made Of'), true);
  assert.equal(await page.isVisible('text=Grid and power equipment'), true);
  await page.goto(server.url + '/intelligence/from-copper-to-compute');
  assert.equal(await page.isVisible('text=Limits of the evidence'), true);
  await context.close();
});

test('motion never hides content when reduced motion is requested', async () => {
  const { context, page } = await open('/', { reducedMotion: 'reduce' });
  const hidden = await page.$$eval('main h2, main .card, main .feature', (els) =>
    els.filter((el) => getComputedStyle(el).opacity === '0' || getComputedStyle(el).visibility === 'hidden').length);
  assert.equal(hidden, 0);
  await context.close();
});

test('axe finds no WCAG A/AA violations on any page', async () => {
  const source = axeSource();
  const { context, page } = await open('/');
  const failures = [];
  for (const path of PAGES) {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(server.url + path);
      await page.addScriptTag({ content: source });
      const result = await page.evaluate(async () => window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
      }));
      for (const v of result.violations) {
        failures.push(`${path} @${width}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
      }
    }
  }
  await context.close();
  assert.deepEqual(failures, []);
});

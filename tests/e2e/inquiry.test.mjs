import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, upstreams } from '../support/server.mjs';
import { loadPlaywright, blockThirdParty } from '../support/browser.mjs';

const { chromium } = loadPlaywright();
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

const MESSAGE = 'We are weighing an investment in grid equipment for a data centre campus.';

async function withPage(serverOptions, fn, contextOptions = {}) {
  const server = await startServer(serverOptions);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', ...contextOptions });
  await blockThirdParty(context);
  const page = await context.newPage();
  try {
    await fn(page, server);
  } finally {
    await context.close();
    await server.close();
  }
}

async function fill(page) {
  await page.fill('#bf-name', 'Ada Example');
  await page.fill('#bf-email', 'ada@example.com');
  await page.fill('#bf-evaluating', MESSAGE);
}

async function expectRetained(page) {
  assert.equal(await page.inputValue('#bf-name'), 'Ada Example');
  assert.equal(await page.inputValue('#bf-evaluating'), MESSAGE);
  assert.equal(await page.isVisible('#bf-success'), false, 'must not show the received state');
  assert.equal(await page.isVisible('#bf-form'), true);
}

test('received: only after the adapter confirms Apps Script said OK', async () => {
  await withPage({}, async (page, server) => {
    await page.goto(server.url + '/work-with-us?interest=invest&research=what-ai-is-made-of&source=research-brief');
    await fill(page);
    await page.click('#bf-submit');
    await page.waitForSelector('#bf-success:not([hidden])');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'bf-success');
    assert.match(await page.textContent('#bf-success'), /Your inquiry has been received/);
    const sent = new URLSearchParams(server.state.upstreamBodies[0]);
    assert.equal(sent.get('request_type'), 'Assessment');
    assert.equal(sent.get('name'), 'Ada Example');
    assert.match(sent.get('additional_context'), /decision=invest; interest=invest; research=what-ai-is-made-of; source=research-brief; request_id=/);
  });
});

test('validation: summary gets focus, errors are tied to fields, nothing is sent', async () => {
  await withPage({}, async (page, server) => {
    await page.goto(server.url + '/work-with-us');
    await page.fill('#bf-evaluating', 'too short');
    await page.click('#bf-submit');
    await page.waitForSelector('#bf-error-summary:not([hidden])');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'bf-error-summary');
    for (const id of ['bf-name', 'bf-email', 'bf-evaluating']) {
      assert.equal(await page.getAttribute(`#${id}`, 'aria-invalid'), 'true', id);
      assert.match(await page.getAttribute(`#${id}`, 'aria-describedby'), new RegExp(`${id}-error`));
    }
    assert.equal(await page.inputValue('#bf-evaluating'), 'too short');
    await page.click('#bf-error-summary a[data-field="email"]');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'bf-email');
    assert.equal(server.state.calls, 0);
  });
});

test('an HTML login page upstream is reported as unconfirmed, text kept', async () => {
  await withPage({ fetchImpl: upstreams.loginPage() }, async (page, server) => {
    await page.goto(server.url + '/work-with-us');
    await fill(page);
    await page.click('#bf-submit');
    await page.waitForSelector('#bf-status[data-tone="error"]');
    assert.match(await page.textContent('#bf-status'), /could not confirm that your inquiry reached us/);
    assert.ok(await page.$('#bf-status a[href^="mailto:sid@motif54.com"]'));
    await expectRetained(page);
  });
});

test('a timeout is reported as uncertain receipt, and the form can be sent again', async () => {
  await withPage({ fetchImpl: upstreams.hang(), timeoutMs: 300 }, async (page, server) => {
    await page.goto(server.url + '/work-with-us');
    await fill(page);
    await page.click('#bf-submit');
    await page.waitForSelector('#bf-status[data-tone="error"]');
    assert.match(await page.textContent('#bf-status'),
      /We could not confirm receipt\. Your message is still here\. You can contact us by email\./);
    await expectRetained(page);
    assert.equal(await page.getAttribute('#bf-submit', 'aria-disabled'), 'false');
    assert.equal(await page.textContent('#bf-submit'), 'Send inquiry');
  });
});

test('missing server configuration (503) offers email and keeps the text', async () => {
  await withPage({ upstreamUrl: undefined }, async (page, server) => {
    await page.goto(server.url + '/work-with-us');
    await fill(page);
    await page.click('#bf-submit');
    await page.waitForSelector('#bf-status[data-tone="error"]');
    assert.match(await page.textContent('#bf-status'), /unavailable right now/);
    await expectRetained(page);
  });
});

test('429, an unexpected 200 and a dropped connection never show received', async () => {
  const stubs = [
    ['rate limited', (route) => route.fulfill({ status: 429, contentType: 'text/plain', body: 'Too Many Requests' }), /Too many attempts/],
    ['200 without ok', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"request_id":"someone-else"}' }), /went wrong/],
    ['200 html', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' }), /went wrong/],
    ['network', (route) => route.abort('connectionreset'), /We could not confirm receipt/]
  ];
  for (const [name, handler, expected] of stubs) {
    await withPage({}, async (page, server) => {
      await page.route('**/.netlify/functions/inquiry', handler);
      await page.goto(server.url + '/work-with-us');
      await fill(page);
      await page.click('#bf-submit');
      await page.waitForSelector('#bf-status[data-tone="error"]');
      assert.match(await page.textContent('#bf-status'), expected, name);
      await expectRetained(page);
    });
  }
});

test('a double click sends one request', async () => {
  await withPage({}, async (page, server) => {
    let requests = 0;
    await page.route('**/.netlify/functions/inquiry', async (route) => {
      requests += 1;
      await new Promise((r) => setTimeout(r, 600));
      await route.continue();
    });
    await page.goto(server.url + '/work-with-us');
    await fill(page);
    // aria-disabled does not block clicks; the in-flight guard must.
    await page.evaluate(() => {
      const b = document.getElementById('bf-submit');
      b.click(); b.click(); b.click();
    });
    await page.waitForSelector('#bf-success:not([hidden])');
    assert.equal(requests, 1);
    assert.equal(server.state.calls, 1);
  });
});

test('pending state is announced', async () => {
  await withPage({}, async (page, server) => {
    await page.route('**/.netlify/functions/inquiry', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });
    await page.goto(server.url + '/work-with-us');
    await fill(page);
    await page.click('#bf-submit');
    assert.match(await page.textContent('#bf-status'), /Sending inquiry/);
    assert.equal(await page.getAttribute('#bf-submit', 'aria-disabled'), 'true');
    await page.waitForSelector('#bf-success:not([hidden])');
  });
});

test('prefill: explicit choices win, context can be removed, hostile values are ignored', async () => {
  await withPage({}, async (page, server) => {
    await page.goto(server.url + '/work-with-us?interest=position&research=from-copper-to-compute&source=research-experience');
    assert.equal(await page.isChecked('#bf-decision-position'), true);
    assert.equal(await page.inputValue('#bf-referral'), 'copper');
    await page.check('#bf-decision-develop');
    await page.click('#bf-context button');
    assert.equal(await page.isVisible('#bf-context'), false);
    await fill(page);
    await page.click('#bf-submit');
    await page.waitForSelector('#bf-success:not([hidden])');
    const sent = new URLSearchParams(server.state.upstreamBodies[0]);
    assert.match(sent.get('additional_context'), /decision=develop/);
    assert.doesNotMatch(sent.get('additional_context'), /research=|source=/);

    await page.goto(server.url + '/work-with-us?interest=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&research=__proto__&source=javascript:alert(1)');
    assert.equal(await page.isVisible('#bf-context'), false);
    assert.equal(await page.$('input[name="decision"]:checked'), null);
    assert.equal(await page.$('img[src="x"]'), null);
  });
});

test('without JavaScript the form is hidden and email is offered', async () => {
  await withPage({}, async (page, server) => {
    await page.goto(server.url + '/work-with-us');
    assert.equal(await page.isVisible('#bf-form'), false);
    assert.equal(await page.textContent('.bf-noscript strong'), 'The inquiry form needs JavaScript.');
    assert.equal(await page.isVisible('.bf-noscript'), true);
    assert.equal(await page.isVisible('.bf-noscript a[href="mailto:sid@motif54.com"]'), true);
  }, { javaScriptEnabled: false });
});

test('the submit button stays disabled if the form script never runs', async () => {
  await withPage({}, async (page, server) => {
    await page.route('**/assets/form.js*', (route) => route.abort());
    await page.goto(server.url + '/work-with-us');
    assert.equal(await page.isDisabled('#bf-submit'), true);
  });
});

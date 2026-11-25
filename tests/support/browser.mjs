/* Playwright for the e2e tests. Playwright is a prerequisite rather than a
   dependency in tests/package.json, because its browser build must match the
   installed Chromium. The tests assert the version they were written for. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
export const PLAYWRIGHT_VERSION = '1.63.0';

export function loadPlaywright() {
  const version = require('playwright/package.json').version;
  if (version !== PLAYWRIGHT_VERSION) {
    throw new Error(`Expected Playwright ${PLAYWRIGHT_VERSION}, found ${version}. Update tests/support/browser.mjs after checking the suite.`);
  }
  return require('playwright');
}

export function axeSource() {
  return readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
}

/* Google Fonts are a third-party request; tests block them so results do not
   depend on the network. Pages must remain usable with fallback fonts. */
export async function blockThirdParty(context) {
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
}

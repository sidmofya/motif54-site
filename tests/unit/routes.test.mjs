import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadRules, resolve } from '../support/netlify-rules.mjs';

const rules = loadRules();
const manifest = JSON.parse(readFileSync(join(ROOT, 'docs/baseline/route-manifest.json'), 'utf8'));
const motifRoutes = manifest.routes.filter((r) => r.owner === 'motif' && r.release1.status);

test('every baseline route resolves to its release-one behaviour', () => {
  for (const r of motifRoutes) {
    const [path, query = ''] = r.path.split('?');
    const out = resolve(rules, ROOT, path, query ? '?' + query : '');
    assert.equal(out.status, r.release1.status, r.path);
    if (r.release1.to) assert.equal(out.location, r.release1.to, r.path);
    if (r.release1.file) assert.equal(out.file, join(ROOT, r.release1.file), r.path);
  }
});

test('legacy redirects are forced, direct (no chains) and keep their query', () => {
  const redirects = rules.filter((r) => r.status === 301);
  const froms = new Set(redirects.map((r) => r.from));
  for (const r of redirects) {
    assert.equal(r.force, true, r.from);
    const target = r.to.split('#')[0];
    assert.equal(froms.has(target), false, `${r.from} chains through ${target}`);
    const final = resolve(rules, ROOT, target, '');
    assert.equal(final.status, 200, `${r.from} -> ${target} must land on a page`);
  }
  assert.equal(resolve(rules, ROOT, '/request-access', '?interest=assessment').location, '/work-with-us?interest=assessment');
});

test('/intelligence is no longer redirected anywhere', () => {
  for (const r of rules.filter((x) => x.status === 301 || x.status === 302)) {
    assert.notEqual(r.from, '/intelligence');
    assert.notEqual(r.from, '/intelligence.html');
  }
  assert.equal(resolve(rules, ROOT, '/intelligence').status, 200);
  assert.equal(resolve(rules, ROOT, '/intelligence.html').status, 200);
});

test('extensionless pages have explicit 200 rewrites to files that exist', () => {
  const rewrites = rules.filter((r) => r.status === 200);
  for (const path of ['/intelligence', '/intelligence/what-ai-is-made-of', '/intelligence/from-copper-to-compute',
    '/advisory', '/approach', '/screen', '/assess', '/projects', '/about', '/work-with-us', '/privacy', '/terms']) {
    const rule = rewrites.find((r) => r.from === path);
    assert.ok(rule, `missing rewrite for ${path}`);
    assert.ok(existsSync(join(ROOT, rule.to)), `${rule.to} missing`);
  }
});

test('publish guards come first and hide repository-only files', () => {
  const guards = rules.filter((r) => r.status === 404);
  assert.deepEqual(rules.slice(0, guards.length), guards, 'guards must precede every other rule');
  for (const g of guards) assert.equal(g.force, true);
  for (const path of ['/netlify/functions/inquiry.mjs', '/tests/unit/routes.test.mjs', '/docs/baseline/route-manifest.json',
    '/README.md', '/apps-script.gs', '/tests/package.json']) {
    const out = resolve(rules, ROOT, path);
    assert.equal(out.status, 404, path);
  }
  // The browser needs the shared schema; it must stay public.
  assert.equal(resolve(rules, ROOT, '/assets/inquiry-schema.mjs').status, 200);
});

test('unknown paths get the real 404 page, not the homepage', () => {
  const out = resolve(rules, ROOT, '/no-such-page');
  assert.equal(out.status, 404);
  assert.equal(out.file, join(ROOT, '404.html'));
});

test('no blanket SPA fallback exists', () => {
  for (const r of rules) assert.notEqual(r.from, '/*');
});

test('the sitemap lists canonical pages only', () => {
  const xml = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(new Set(locs).size, locs.length, 'duplicate sitemap URLs');
  for (const loc of locs) {
    const path = new URL(loc).pathname;
    const out = resolve(rules, ROOT, path);
    assert.equal(out.status, 200, `${loc} must not redirect`);
    const html = readFileSync(out.file, 'utf8');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, `${loc} has no canonical`);
    assert.equal(canonical[1], loc, `${loc} canonical mismatch`);
  }
  for (const path of ['/intelligence', '/intelligence/what-ai-is-made-of', '/intelligence/from-copper-to-compute', '/advisory', '/approach']) {
    assert.ok(locs.includes('https://motif54.com' + path), path);
  }
});

test('headers keep vendor files immutable and nothing else', () => {
  const toml = readFileSync(join(ROOT, 'netlify.toml'), 'utf8');
  assert.match(toml, /for = "\/assets\/vendor\/\*"[\s\S]*?immutable/);
  assert.equal((toml.match(/immutable/g) || []).length, 1);
  assert.match(toml, /publish = "\."/);
  assert.match(toml, /command = ""/);
});

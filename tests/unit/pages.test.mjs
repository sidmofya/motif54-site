import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadRules, resolve } from '../support/netlify-rules.mjs';

const rules = loadRules();
const PAGES = [
  'index.html', 'intelligence.html', 'intelligence/what-ai-is-made-of.html', 'intelligence/from-copper-to-compute.html',
  'advisory.html', 'approach.html', 'about.html', 'projects.html', 'screen.html', 'assess.html', 'work-with-us.html',
  'privacy.html', 'terms.html', '404.html'
];
/* Pages written or rewritten for release one. Their copy follows the owner's
   style: no em dashes. Screen, Assess, Privacy and Terms keep older copy. */
const NEW_COPY = ['index.html', 'intelligence.html', 'intelligence/what-ai-is-made-of.html',
  'intelligence/from-copper-to-compute.html', 'advisory.html', 'approach.html', 'about.html', 'projects.html',
  'work-with-us.html', '404.html'];

const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const html = Object.fromEntries(PAGES.map((p) => [p, read(p)]));
const block = (s, re) => (s.match(re) || [''])[0];
const stripCurrent = (s) => s.replace(/ aria-current="(page|true)"/g, '');

test('every HTML page at the root is covered by these tests', () => {
  const found = readdirSync(ROOT).filter((f) => f.endsWith('.html'))
    .concat(readdirSync(join(ROOT, 'intelligence')).map((f) => 'intelligence/' + f));
  assert.deepEqual(found.sort(), [...PAGES].sort());
});

test('header and footer are identical on every page', () => {
  const header = stripCurrent(block(html['index.html'], /<header[\s\S]*?<\/header>/));
  const footer = block(html['index.html'], /<footer[\s\S]*?<\/footer>/);
  assert.ok(header && footer);
  for (const p of PAGES) {
    assert.equal(stripCurrent(block(html[p], /<header[\s\S]*?<\/header>/)), header, `${p} header`);
    assert.equal(block(html[p], /<footer[\s\S]*?<\/footer>/), footer, `${p} footer`);
  }
});

test('primary navigation is Intelligence, Advisory, About and Start a conversation', () => {
  const nav = block(html['index.html'], /<nav class="site-nav"[\s\S]*?<\/nav>/);
  const links = [...nav.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)</g)]
    .map((m) => [m[1], m[2].trim()])
    .filter(([href]) => href !== '/');
  assert.deepEqual(links, [
    ['/intelligence', 'Intelligence'], ['/advisory', 'Advisory'], ['/about', 'About'], ['/work-with-us', 'Start a conversation']
  ]);
  assert.match(nav, /<a class="brand-link" href="\/">[\s\S]*?MOTIF 54<\/span><span class="visually-hidden">, home<\/span>/);
});

test('each page marks where the visitor is', () => {
  const expect = {
    'intelligence.html': ['/intelligence', 'page'], 'intelligence/what-ai-is-made-of.html': ['/intelligence', 'true'],
    'intelligence/from-copper-to-compute.html': ['/intelligence', 'true'], 'advisory.html': ['/advisory', 'page'],
    'screen.html': ['/advisory', 'true'], 'assess.html': ['/advisory', 'true'], 'about.html': ['/about', 'page'],
    'projects.html': ['/about', 'true'], 'work-with-us.html': ['/work-with-us', 'page']
  };
  for (const [p, [href, value]] of Object.entries(expect)) {
    assert.match(block(html[p], /<header[\s\S]*?<\/header>/), new RegExp(`href="${href}"[^>]*aria-current="${value}"`), p);
  }
});

test('one h1, a skip link, landmarks and lang on every page', () => {
  for (const p of PAGES) {
    const s = html[p];
    assert.equal((s.match(/<h1[\s>]/g) || []).length, 1, `${p} h1 count`);
    assert.match(s, /<html lang="en">/, p);
    assert.match(s, /<a class="skip-link" href="#main">/, p);
    assert.match(s, /<main[^>]*id="main"/, p);
    assert.match(s, /<nav class="site-nav" aria-label="Primary">/, p);
  }
});

test('headings do not skip levels', () => {
  for (const p of PAGES) {
    const levels = [...html[p].matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i++) {
      assert.ok(levels[i] <= levels[i - 1] + 1, `${p}: h${levels[i - 1]} then h${levels[i]}`);
    }
  }
});

test('titles and descriptions are unique; canonicals and og:url agree', () => {
  const titles = new Set();
  const descs = new Set();
  for (const p of PAGES) {
    const s = html[p];
    const title = s.match(/<title>([^<]+)<\/title>/)[1];
    const desc = s.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(!titles.has(title), `duplicate title ${title}`);
    assert.ok(!descs.has(desc), `duplicate description on ${p}`);
    titles.add(title);
    descs.add(desc);
    if (p === '404.html') {
      assert.match(s, /<meta name="robots" content="noindex"/);
      assert.doesNotMatch(s, /rel="canonical"/);
      continue;
    }
    const canonical = s.match(/<link rel="canonical" href="([^"]+)"/)[1];
    assert.match(canonical, /^https:\/\/motif54\.com\/[a-z0-9/-]*$/, `${p} canonical is extensionless`);
    assert.equal(s.match(/<meta property="og:url" content="([^"]+)"/)[1], canonical, `${p} og:url`);
    assert.match(s, /<meta property="og:title" content="[^"]+"/, p);
    assert.match(s, /<meta property="og:description" content="[^"]+"/, p);
    const resolved = resolve(rules, ROOT, new URL(canonical).pathname);
    assert.equal(resolved.file, join(ROOT, p), `${p} canonical resolves to itself`);
  }
  assert.equal(html['index.html'].match(/<title>([^<]+)<\/title>/)[1], 'MOTIF 54 | Advisory for the New Industrial Era');
});

test('no page is accidentally noindexed except the 404', () => {
  for (const p of PAGES.filter((x) => x !== '404.html')) assert.doesNotMatch(html[p], /noindex/, p);
  assert.doesNotMatch(read('robots.txt'), /Disallow:\s*\//);
});

test('every internal link resolves to a page, and fragments exist', () => {
  for (const p of PAGES) {
    for (const [, href] of html[p].matchAll(/href="(\/[^"]*)"/g)) {
      const clean = href.replace(/&amp;/g, '&');
      const [pathAndQuery, fragment] = clean.split('#');
      const [path, query] = pathAndQuery.split('?');
      if (path.startsWith('/assets/')) {
        assert.ok(existsSync(join(ROOT, path)), `${p}: ${href}`);
        continue;
      }
      const out = resolve(rules, ROOT, path, query ? '?' + query : '');
      assert.ok(out.status === 200, `${p}: ${href} -> ${out.status}`);
      if (fragment) {
        assert.match(readFileSync(out.file, 'utf8'), new RegExp(`id="${fragment}"`), `${p}: #${fragment} missing`);
      }
    }
  }
});

test('legacy anchors stay on their pages', () => {
  for (const id of ['two-doors', 'screen', 'assess', 'ai-infrastructure', 'critical-minerals']) {
    assert.match(html['index.html'], new RegExp(`id="${id}"`), `index #${id}`);
  }
  for (const id of ['ai-infrastructure', 'critical-minerals']) {
    assert.match(html['projects.html'], new RegExp(`id="${id}"`), `projects #${id}`);
  }
  for (const id of ['invest', 'position', 'develop']) {
    assert.match(html['advisory.html'], new RegExp(`id="${id}"`), `advisory #${id}`);
  }
});

test('existing destinations keep working: CopperCloud, Kafwego, screening and assessment CTAs', () => {
  assert.match(html['projects.html'], /href="https:\/\/coppercloud\.ai"/);
  assert.match(html['projects.html'], /href="\/work-with-us\?interest=kafwego"/);
  assert.match(html['screen.html'], /href="\/work-with-us\?interest=screening"/);
  assert.match(html['assess.html'], /href="\/work-with-us\?interest=assessment"/);
  assert.match(html['projects.html'], /does not\s+constitute an offer to sell or a solicitation/);
});

test('new pages contain no em dashes', () => {
  for (const p of NEW_COPY) {
    const text = html[p].replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(text, /—|&mdash;/, p);
  }
});

test('external links that open a new tab say so and use noopener', () => {
  for (const p of PAGES) {
    for (const [tag] of html[p].matchAll(/<a [^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g)) {
      assert.match(tag, /rel="noopener"/, `${p}: ${tag}`);
      assert.match(tag, /opens in a new tab/, `${p}: ${tag}`);
    }
  }
});

test('research links stay in the same tab', () => {
  for (const p of PAGES) {
    for (const [tag] of html[p].matchAll(/<a [^>]*href="https:\/\/ai\.sidmofya\.com[^"]*"[^>]*>/g)) {
      assert.doesNotMatch(tag, /target=/, `${p}: ${tag}`);
    }
  }
});

test('images reserve their dimensions and carry alt text', () => {
  for (const p of PAGES) {
    for (const [tag] of html[p].matchAll(/<img [^>]*>/g)) {
      assert.match(tag, /width="\d+"/, `${p}: ${tag}`);
      assert.match(tag, /height="\d+"/, `${p}: ${tag}`);
      assert.match(tag, /alt="/, `${p}: ${tag}`);
    }
  }
});

test('no page loads the retired orb, Lenis or SplitText', () => {
  for (const p of PAGES) {
    assert.doesNotMatch(html[p], /orb\.js|lenis|SplitText/, p);
  }
  assert.equal(existsSync(join(ROOT, 'assets/orb.js')), false);
});

test('no analytics, trackers or third-party scripts', () => {
  for (const p of PAGES) {
    for (const [, src] of html[p].matchAll(/<script[^>]*src="([^"]+)"/g)) {
      assert.match(src, /^\/assets\//, `${p}: ${src}`);
    }
    assert.doesNotMatch(html[p], /googletagmanager|google-analytics|plausible|gtag\(|fbq\(/, p);
  }
});

test('the inquiry page: labels, honeypot, disabled-until-ready submit, no-JS fallback', () => {
  const s = html['work-with-us.html'];
  assert.match(s, /<h1>What decision are you facing\?<\/h1>/);
  for (const [id, name] of [['bf-name', 'name'], ['bf-org', 'organization'], ['bf-email', 'email'], ['bf-evaluating', 'evaluating'],
    ['bf-timeframe', 'timeframe'], ['bf-linkedin', 'linkedin'], ['bf-referral', 'referral']]) {
    assert.match(s, new RegExp(`<label[^>]*for="${id}"`), `label for ${id}`);
    assert.match(s, new RegExp(`id="${id}"[^>]*name="${name}"|name="${name}"[^>]*id="${id}"`), `${id} name`);
  }
  for (const v of ['invest', 'position', 'develop', 'screening', 'project', 'unsure']) {
    assert.match(s, new RegExp(`<label class="bf-radio-option" for="bf-decision-${v}">`), v);
  }
  assert.match(s, /<legend class="bf-question">What kind of decision\?<\/legend>/);
  assert.match(s, /<button type="submit" class="bf-btn" id="bf-submit" disabled>Send inquiry<\/button>/);
  assert.match(s, /name="company_website" tabindex="-1"/);
  assert.match(s, /<noscript><style>#bf-form \{ display: none; \}<\/style><\/noscript>/);
  assert.match(s, /<noscript>[\s\S]*mailto:sid@motif54\.com[\s\S]*<\/noscript>/);
  assert.match(s, /id="bf-status" class="bf-status" role="status"/);
  assert.match(s, /Thank you\. Your inquiry has been received\./);
  assert.match(s, /do not submit confidential or commercially sensitive/);
  assert.match(s, /<script type="module" src="\/assets\/form\.js\?v=\d+"><\/script>/);
  assert.doesNotMatch(read('assets/form.js'), /no-cors|script\.google\.com/);
});

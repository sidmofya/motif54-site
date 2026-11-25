import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../support/netlify-rules.mjs';
import { RESEARCH_IDS, INTEREST_MAP } from '../../assets/inquiry-schema.mjs';

const record = JSON.parse(readFileSync(join(ROOT, 'assets/data/intelligence.json'), 'utf8'));
const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const decode = (s) => s.replace(/&amp;/g, '&');

const REQUIRED = ['id', 'title', 'author', 'topics', 'format', 'question', 'description', 'interpretation',
  'application_questions', 'experience_url', 'evidence_url', 'scope_note', 'source_revision',
  'source_review_date', 'motif_editorial_review_date', 'brief_url', 'advisory_anchor', 'inquiry', 'thumbnail'];

test('each evidence record is complete and allowlisted', () => {
  assert.equal(record.entries.length, Object.keys(RESEARCH_IDS).length);
  for (const e of record.entries) {
    for (const k of REQUIRED) assert.ok(k in e, `${e.id}: ${k}`);
    assert.ok(RESEARCH_IDS[e.id], `${e.id} is an allowlisted research id`);
    assert.equal(RESEARCH_IDS[e.id].title, e.title);
    assert.ok(INTEREST_MAP[e.inquiry.interest], e.inquiry.interest);
    assert.equal(e.inquiry.research, e.id);
    assert.ok(existsSync(join(ROOT, e.thumbnail.path)), e.thumbnail.path);
    assert.equal(e.author, 'Sid Mofya');
    assert.equal(e.numbers_published_on_motif, false);
    // Dates are either unknown (null) or a real ISO date, never filled in automatically.
    for (const d of ['source_review_date', 'motif_editorial_review_date']) {
      assert.ok(e[d] === null || /^\d{4}-\d{2}-\d{2}$/.test(e[d]), `${e.id}: ${d}`);
    }
    for (const u of [e.experience_url, e.evidence_url, ...(e.related_urls || [])]) {
      assert.match(u, /^https:\/\/ai\.sidmofya\.com\//, u);
      assert.doesNotMatch(u, /github\.com|massbal_intelligence/, u);
    }
  }
});

test('each entry has a brief, an index row, a homepage row and a sitemap URL', () => {
  const sitemap = read('sitemap.xml');
  const index = read('intelligence.html');
  const home = read('index.html');
  for (const e of record.entries) {
    const path = new URL(e.brief_url).pathname;
    const brief = decode(read(path.slice(1) + '.html'));
    assert.ok(sitemap.includes(`<loc>${e.brief_url}</loc>`), `${e.id} sitemap`);
    assert.match(index, new RegExp(`id="${e.id}"`), `${e.id} index row`);
    assert.match(home, new RegExp(`id="${e.id}"`), `${e.id} home row`);
    assert.ok(decode(index).includes(`href="${path}"`), `${e.id} index links to its brief`);
    assert.ok(decode(home).includes(`href="${path}"`), `${e.id} home links to its brief`);
    assert.ok(decode(home).includes(`href="${e.experience_url}"`), `${e.id} home links straight to the experience`);
    assert.ok(brief.includes(`href="${e.experience_url}"`), `${e.id} brief has Explore`);
    assert.ok(brief.includes(e.question), `${e.id} brief deck`);
    for (const line of e.interpretation) assert.ok(brief.includes(line), `${e.id} interpretation: ${line}`);
    const cta = `/work-with-us?interest=${e.inquiry.interest}&research=${e.id}&source=research-brief`;
    assert.ok(brief.includes(`href="${cta}"`), `${e.id} brief inquiry CTA`);
    assert.ok(brief.includes(`href="${e.advisory_anchor}"`), `${e.id} advisory link`);
    assert.match(brief, /Research by Sid Mofya/);
    assert.match(brief, /MOTIF interpretation/);
    assert.match(brief, /class="limits"/);
  }
});

test('the copper review date is shown as the source states it; the model shows none', () => {
  const index = read('intelligence.html');
  assert.match(index, /16 November 2026, as stated by the research source/);
  const waimo = index.slice(index.indexOf('id="what-ai-is-made-of"'), index.indexOf('id="from-copper-to-compute"'));
  assert.doesNotMatch(waimo, /reviewed/i);
});

test('MOTIF pages publish no research quantities', () => {
  const unit = /\d[\d,.]*\s*(%|t\b|tonnes?|MW|GW|kW|MVA|million|billion|days?)\b/i;
  for (const f of ['index.html', 'intelligence.html', 'intelligence/what-ai-is-made-of.html', 'intelligence/from-copper-to-compute.html', 'advisory.html']) {
    const text = read(f).replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, unit, f);
  }
});

test('prohibited framings stay out of the briefs', () => {
  /* The briefs may name a framing only to rule it out. Remove those
     negations, then nothing that asserts the framing may remain. */
  const allowed = [
    /not probabilities or confidence intervals/gi,
    /not an operating facility/gi,
    /not a procurement order, shipment timetable or verified whole-campus inventory/gi,
    /Throughput comparisons are not lead times/gi,
    /not a validated investment recommendation/gi
  ];
  const forbidden = [/confidence interval/i, /operating (site|facility)/i, /whole-campus/i, /lead time/i,
    /delivery (time|promise|date)/i, /client outcome/i, /\bproven\b/i, /validated/i, /shipment from/i];
  for (const f of ['intelligence/what-ai-is-made-of.html', 'intelligence/from-copper-to-compute.html']) {
    let text = read(f).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const re of allowed) text = text.replace(re, '');
    for (const re of forbidden) assert.doesNotMatch(text, re, `${f}: ${re}`);
  }
  const waimo = read('intelligence/what-ai-is-made-of.html').replace(/\s+/g, ' ');
  assert.match(waimo, /not probabilities or confidence intervals/);
  assert.match(waimo, /It is not an operating facility, construction design or procurement schedule/);
  const copper = read('intelligence/from-copper-to-compute.html').replace(/\s+/g, ' ');
  assert.match(copper, /Throughput comparisons are not lead times/);
  assert.match(copper, /does not trace an actual shipment/);
});

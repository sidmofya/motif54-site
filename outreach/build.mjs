#!/usr/bin/env node
/*
 * MOTIF 54 — outreach microsite generator.
 *
 * Reads every outreach/recipients/<code>.json, fills outreach/template.html,
 * and writes a static page to /r/<code>/index.html at the repo root so Netlify
 * publishes it. No framework, no dependencies — Node ≥ 18.
 *
 *   node outreach/build.mjs
 *
 * The view-tracking endpoint is read from the OUTREACH_TRACKING_ENDPOINT env
 * var (the same Apps Script web-app URL pattern used by request-access.html).
 * If unset, the generated page's beacon is a silent no-op.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RECIPIENTS_DIR = join(__dirname, 'recipients');
const TEMPLATE_PATH = join(__dirname, 'template.html');
const TRACKING_ENDPOINT = process.env.OUTREACH_TRACKING_ENDPOINT || '';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Replace every {{key}} in `str` from `data` (HTML-escaped). Unknown keys -> ''.
function fill(str, data) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in data && data[key] != null ? escapeHtml(data[key]) : ''
  );
}

// Expand the <!--SECTIONS--> ... <!--/SECTIONS--> block once per section.
function renderSections(template, sections) {
  const re = /<!--SECTIONS-->([\s\S]*?)<!--\/SECTIONS-->/;
  const m = template.match(re);
  if (!m) return template;
  const block = m[1];
  const html = (sections || [])
    .map((s, i) =>
      fill(block, { n: String(i + 1).padStart(2, '0'), title: s.title, body: s.body })
    )
    .join('\n');
  return template.replace(re, html);
}

function buildOne(template, data) {
  let html = renderSections(template, data.sections);
  html = fill(html, { ...data, tracking_endpoint: TRACKING_ENDPOINT });
  const outDir = join(ROOT, 'r', data.code);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');
  return `/r/${data.code}/`;
}

function main() {
  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const files = readdirSync(RECIPIENTS_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.warn('No recipients found in', RECIPIENTS_DIR);
    return;
  }
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(RECIPIENTS_DIR, file), 'utf8'));
    if (!data.code) {
      console.error(`Skipping ${file}: missing "code"`);
      continue;
    }
    const url = buildOne(template, data);
    console.log(`✓ ${file} → ${url}`);
  }
  console.log(
    TRACKING_ENDPOINT
      ? 'Tracking endpoint: set'
      : 'Tracking endpoint: not set (beacon disabled). Set OUTREACH_TRACKING_ENDPOINT to enable.'
  );
}

main();

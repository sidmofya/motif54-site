#!/usr/bin/env node
/*
 * Render one personalized outreach video per recipient and drop it where the
 * page generator expects it (/r/<code>/video.mp4).
 *
 *   node outreach/video/render.mjs            # render every recipient
 *   node outreach/video/render.mjs cf01       # render one
 *
 * Prereqs:
 *   1. cd outreach/video && npm install
 *   2. Record ONE talking-head take and save it as outreach/video/public/take.mp4
 *      (vertical, ~25-35s, looking at camera — see README.md).
 *
 * Slides come from each outreach/recipients/<code>.json `video_slides`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const RECIPIENTS_DIR = join(ROOT, 'outreach', 'recipients');
const ENTRY = join(__dirname, 'src', 'index.ts');

function recipients() {
  const only = process.argv[2];
  const files = readdirSync(RECIPIENTS_DIR).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => JSON.parse(readFileSync(join(RECIPIENTS_DIR, f), 'utf8')))
    .filter((r) => r.code && (!only || r.code === only));
}

for (const r of recipients()) {
  const outDir = join(ROOT, 'r', r.code);
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'video.mp4');
  const props = JSON.stringify({ slides: r.video_slides || [], takeSrc: 'take.mp4' });

  console.log(`▶ rendering /r/${r.code}/video.mp4 …`);
  execFileSync(
    'npx',
    ['remotion', 'render', ENTRY, 'OutreachVideo', outFile, `--props=${props}`],
    { cwd: __dirname, stdio: 'inherit' }
  );
  console.log(`✓ /r/${r.code}/video.mp4`);
}

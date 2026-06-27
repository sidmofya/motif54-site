#!/usr/bin/env node
/*
 * MOTIF 54 — outreach copy drafter.
 *
 * Takes a short research brief and drafts the per-recipient copy in the MOTIF 54
 * voice via the Claude API, then writes outreach/recipients/<code>.json for
 * HUMAN REVIEW before send. Never ship a draft unread — the specificity is the
 * whole point, and a wrong fact reads worse than no outreach at all.
 *
 *   ANTHROPIC_API_KEY=... node outreach/draft.mjs path/to/brief.json
 *
 * Brief shape (you write this — keep the research real):
 *   {
 *     "code": "cf01",                       // URL slug for /r/<code>
 *     "company": "Gridworks",
 *     "first_name": "Chris",
 *     "recipient_role": "Transmission developer",
 *     "cta_url": "https://www.linkedin.com/in/sidmofya",
 *     "research": "Free text: what they build, the specific deal/asset, who's
 *                  already on the cap table, where it has stalled, any names/
 *                  facts that prove you did the work. The more concrete, the
 *                  better the draft."
 *   }
 *
 * Requires: npm i @anthropic-ai/sdk   (Node >= 18)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECIPIENTS_DIR = join(__dirname, 'recipients');
const MODEL = 'claude-opus-4-8';

// MOTIF 54 voice, grounded in the live site copy so drafts sound native.
const SYSTEM = `You are the copywriter for MOTIF 54, writing a one-to-one outreach
microsite addressed to a single named prospect. MOTIF 54 structures the first-loss
equity that committed debt needs before it can deploy on African energy, minerals,
and infrastructure — "closing the equity gate" — without lending and without taking
the asset. Founder & CEO: Sid Mofya, San Francisco.

VOICE: spare, declarative, capital-facing. Short sentences. No hype, no adjectives
for their own sake, no exclamation marks, no emoji. Lead with THE PROSPECT'S problem,
never with MOTIF 54. Use their specific facts (the asset, who is already on the cap
table, where it has stalled) — that specificity is the persuasion. Recurring true
phrases you may draw on: "close the gate", "first-loss equity", "the layer beneath
the senior debt", "I do not lend, and I do not take the asset", "twenty minutes, no
deck". Curly quotes/apostrophes. Second person ("you").

Write only what the research supports. Do not invent facts, numbers, or names. If the
research is thin, keep claims general rather than fabricating specifics.`;

// Structured-output schema (no recursion / numeric constraints — all string fields).
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    prepared_for: { type: 'string', description: 'Eyebrow, e.g. "PREPARED FOR GRIDWORKS" (uppercase)' },
    subhead: { type: 'string', description: 'e.g. "For Chris at Gridworks."' },
    hero_para: { type: 'string', description: 'The opener under the big name. 3-5 sentences, leads with their work.' },
    subnote: { type: 'string', description: 'One line under the CTAs, e.g. "Twenty minutes. On one of your own asset types."' },
    why_para: { type: 'string', description: 'The "WHY I REACHED OUT" quote card. 3-4 sentences, first person as Sid.' },
    positioning_para: { type: 'string', description: 'One short paragraph: "I do not lend... that is the whole job."' },
    video_slides: {
      type: 'array',
      description: 'Exactly 4 short on-screen title-card lines for the personal video, first one greets them by name.',
      items: { type: 'string' }
    },
    sections: {
      type: 'array',
      description: 'Exactly 3 numbered argument sections, each tailored to their asset class.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          body: { type: 'string' }
        },
        required: ['title', 'body']
      }
    },
    closing_sub: { type: 'string', description: 'Subhead under the closing "Twenty minutes, <name>." block.' }
  },
  required: ['prepared_for', 'subhead', 'hero_para', 'subnote', 'why_para',
             'positioning_para', 'video_slides', 'sections', 'closing_sub']
};

async function main() {
  const briefPath = process.argv[2];
  if (!briefPath) {
    console.error('Usage: node outreach/draft.mjs path/to/brief.json');
    process.exit(1);
  }
  const brief = JSON.parse(readFileSync(resolve(briefPath), 'utf8'));
  for (const k of ['code', 'company', 'first_name']) {
    if (!brief[k]) { console.error(`Brief is missing required field "${k}"`); process.exit(1); }
  }

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  const userPrompt = `Draft the outreach microsite copy for this prospect.

Company: ${brief.company}
Name: ${brief.first_name}
Role: ${brief.recipient_role || '(unknown)'}

Research / what I know about them and their deal:
${brief.research || '(none provided — keep claims general)'}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: userPrompt }]
  });

  if (response.stop_reason === 'refusal') {
    console.error('Model declined the request:', response.stop_details);
    process.exit(1);
  }

  const text = response.content.find((b) => b.type === 'text')?.text;
  const drafted = JSON.parse(text);

  // Merge passthrough fields the template needs but the model shouldn't invent.
  const recipient = {
    code: brief.code,
    company: brief.company,
    first_name: brief.first_name,
    recipient_role: brief.recipient_role || '',
    ...drafted,
    video_caption: `A personal note from Sid Mofya at MOTIF 54.`,
    cta_label: brief.cta_label || 'Twenty minutes with me, no deck',
    cta_url: brief.cta_url || 'https://www.linkedin.com/in/sidmofya',
    created: new Date().toISOString().slice(0, 10)
  };

  mkdirSync(RECIPIENTS_DIR, { recursive: true });
  const outPath = join(RECIPIENTS_DIR, `${brief.code}.json`);
  writeFileSync(outPath, JSON.stringify(recipient, null, 2) + '\n', 'utf8');
  console.log(`✓ Drafted ${outPath} — REVIEW AND EDIT before running build.mjs.`);
}

main().catch((err) => { console.error(err); process.exit(1); });

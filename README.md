# motif54.com

Static site for MOTIF 54: hand-written HTML, one shared stylesheet, a few
vanilla-JS files and one Netlify function for the inquiry form. There is no
framework and no build step; the repository root is the published site.

Legal operating entity: **CXB Ventures LLC dba MOTIF 54** (a California LLC).
The public brand is MOTIF 54; the legal name appears only where the operating
entity must be identified (footer, `/privacy`, `/terms`).

## Positioning

MOTIF 54 is an advisory for the new industrial era. It helps investors and
industrial leaders make consequential decisions across intelligence, energy,
minerals and capital.

The site leads with intelligence: selected public research on the physical
systems behind AI. Each research entry connects to a decision a buyer could
commission. Advisory is organised as **Invest · Position · Develop**, with
screening and commissioned assessment kept as practical entry points. AI is
part of the research method; people stay accountable for the advice. The
African vantage point is a source of context and access, not the firm's
category.

Do not present MOTIF 54 as an AI-adoption agency, software vendor, fund,
placement agent or subscription research platform. Project interests
(CopperCloud, Kafwego) are principal participation, never client case
studies.

## Routes

Pages are `.html` files, linked without the extension. `netlify.toml` declares
explicit 200 rewrites for every extensionless page.

| URL | File | Notes |
| --- | --- | --- |
| `/` | `index.html` | Hero and dependency map, featured intelligence, Invest/Position/Develop, approach, practice evidence, closing. Keeps the legacy anchors `#two-doors`, `#screen`, `#assess`, `#ai-infrastructure`, `#critical-minerals` |
| `/intelligence` | `intelligence.html` | The research index: question, format, author, scope and source dates |
| `/intelligence/what-ai-is-made-of` | `intelligence/what-ai-is-made-of.html` | Decision brief for the model at ai.sidmofya.com |
| `/intelligence/from-copper-to-compute` | `intelligence/from-copper-to-compute.html` | Decision brief for the copper journey |
| `/advisory` | `advisory.html` | `#invest`, `#position`, `#develop`, the Industrial Bottleneck Review, ways to work, process |
| `/approach` | `approach.html` | Evidence, assumptions, AI use, human accountability, corrections, confidential material |
| `/about` | `about.html` | Founder, vantage point, participation disclosure |
| `/projects` | `projects.html` | `#ai-infrastructure` and `#critical-minerals` anchor the project cards |
| `/screen`, `/assess` | `screen.html`, `assess.html` | Existing services, framed under Advisory |
| `/work-with-us` | `work-with-us.html` | The inquiry form ("Start a conversation"); accepts `?interest=`, `?research=`, `?source=` |
| `/privacy`, `/terms` | `privacy.html`, `terms.html` | Footer only |
| anything else | `404.html` | Served by Netlify with a real 404 status |

Primary navigation on every page: **Intelligence · Advisory · About · Start a
conversation**. The header and footer are identical on every page except for
`aria-current`; `tests/unit/pages.test.mjs` enforces that, so edit all pages
together.

Retired URLs redirect in `netlify.toml`, each straight to its final
destination (Netlify does not chain redirects): `/programs`,
`/strategic-asset-intelligence`, `/decision-rooms`, `/situation-room.html` and
`/intelligence-feed.html` go to `/assess`; `/critical-minerals` goes to
`/projects#critical-minerals`; `/request-access` and `/briefing.html` go to
`/work-with-us`, keeping the query string. `/intelligence` redirected to
`/assess` until November 2026 and now serves the intelligence index again.
`docs/baseline/route-manifest.json` records every route before and after that
change and drives the route tests.

### Publish guard

Because the repository root is the publish directory, every committed file
would be served. Force-404 rules at the top of `netlify.toml` hide repository
material: `/netlify/*` (function source), `/tests/*`, `/docs/*`, `/README.md`,
`/apps-script.gs` and `/.gitignore`. A `.gitignore` entry does not keep a
committed file off the site; add a guard for any new repository-only folder.
Never put screenshots with personal data, private research extracts or
secrets in this repository.

## Research boundaries

The research belongs to Sid Mofya and lives at https://ai.sidmofya.com
(repository `sidmofya/massbal_intelligence`, `anatomy/`). MOTIF owns the
commercial explanation and the inquiry; the research site owns its
interactions, model versions and evidence. MOTIF pages link to the research
in the same tab and never embed it.

- Credit every entry "Research by Sid Mofya".
- MOTIF pages publish **no research quantities**. Read numbers at the source,
  with their assumptions. `tests/unit/content.test.mjs` rejects quantities
  with units on the intelligence pages.
- Label MOTIF's reading as "MOTIF interpretation", never as a validated
  recommendation. Keep each brief's limitations panel.
- Link only to published public evidence on ai.sidmofya.com, never to the
  private repository.
- Do not republish an upstream change automatically. Re-check both the
  conclusion and its qualification first.

### Adding a research entry

1. Add a record to `assets/data/intelligence.json` with every field the
   existing records carry. Leave unknown dates `null`; never use today's date
   as a research date.
2. Add the research id to `RESEARCH_IDS` in `assets/inquiry-schema.mjs`.
3. Write `intelligence/<id>.html` from an existing brief: deck, opening,
   figure with a text equivalent, three observations with interpretations,
   limitations, Explore links, and an inquiry CTA to
   `/work-with-us?interest=<invest|position|develop>&research=<id>&source=research-brief`.
4. Add an entry to `intelligence.html` and, if featured, `index.html`.
5. Add a 200 rewrite to `netlify.toml` and the URL to `sitemap.xml`.
6. Run the tests. No change to the research application is needed.

An unpublished title may appear as "In development" with no link and no
findings. Do not list proposed titles as if they exist.

## Design system

Defined once in `assets/style.css`. Do not introduce a second palette or type
stack; reuse the tokens.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` / `--bg-1` / `--bg-2` | `#161518` / `#1B1A1E` / `#222126` | warm charcoal canvas / cards / raised |
| `--line` / `--line-2` | `rgba(255,255,255,.08)` / `.14` | hairline borders |
| `--fg` / `--fg-muted` / `--fg-dim` | `#F4F4F2` / `#A2A0A6` / `#8C8A93` | headings / body / meta |
| `--accent` | `#D08A5A` | copper: eyebrows, numbers, structure, focus |
| `--accent-2` | `#E36A60` | red: link underlines, emphasis, errors |
| `--font-display` | Space Grotesk | headings and body |
| `--font-mono` | JetBrains Mono | eyebrows, buttons, nav, labels, footer |
| `--container` | `1100px` | page width |

Contrast is checked by axe in the e2e suite (WCAG 2.2 AA tags), not asserted
here.

Conventions:

- Never type `//` in an eyebrow; `.eyebrow::before` supplies it.
- Copper is structure, red is emphasis.
- Sections are separated by `<hr/>`.
- Prose is capped near 68 characters per line. Body text is 17.5px on
  desktop and 17px on phones.
- Research entries are editorial rows (`.feature`), not a card grid.
  Diagrams are built from lists (`.system-map`, `.sequence`) so they read as
  text, reflow on phones and need no image.
- Illustrations are original line drawings labelled "Illustration, not to
  scale". Do not use stock or generated imagery as evidence of real assets.
- Links to ai.sidmofya.com open in the same tab. Other external links that
  open a new tab carry `rel="noopener"` and a visually hidden "(opens in a
  new tab)".
- The nav collapses to a disclosure below 900px (`assets/nav.js`).

### Motion

`assets/motion.js` adds quiet, optional motion with self-hosted GSAP 3.15.0
(ScrollTrigger, ScrambleText, DrawSVG): eyebrows decode once, rules draw,
cards and headings come into focus, ghosted layers lag the scroll, and the
nav mark draws on the homepage. All of it sits behind
`prefers-reduced-motion: no-preference`, and start states are set from JS
only, so the page is complete without it. Scrolling is the browser's own and
the hero text is never hidden waiting for an animation.

`assets/vendor/` holds pinned, versioned copies and is served `immutable`.
To upgrade, add new versioned files and update the `<script>` tags; never
replace a file in place. SplitText and Lenis remain in the folder but no page
loads them. The homepage orb (`orb.js`) was removed in November 2026.

## The inquiry form

```
browser (assets/form.js)
  -> POST /.netlify/functions/inquiry   (same origin, JSON)
     netlify/functions/inquiry.mjs validates, then
  -> POST <INQUIRY_UPSTREAM_URL>        (form-encoded, allowlisted fields)
     Google Apps Script appends a sheet row and emails sid@motif54.com
  <- "OK"
```

The page shows "received" only when the adapter returns HTTP 200 with
`ok: true` and the request id the page generated, and the adapter returns that
only when Apps Script answers `OK` (directly or after its usual redirect to
`script.googleusercontent.com/macros/echo`). An HTML login page, an unexpected
body, any other redirect, a timeout (15 s) or an error is never shown as
received, and the visitor's text stays in the form with an email alternative.

`assets/inquiry-schema.mjs` holds the field rules, value lists and mappings.
Both the browser and the function import it, so they cannot disagree.

### Configuration

Set **`INQUIRY_UPSTREAM_URL`** in Netlify (Site configuration, Environment
variables) with the **Functions** scope, to the Apps Script web app URL
(`https://script.google.com/macros/s/<deployment id>/exec`). Values in
`netlify.toml` do not reach functions. Without a valid value the function
answers 503 and the page offers email. The browser never supplies a
destination.

### Contract

| Status | Body | Meaning |
| --- | --- | --- |
| 200 | `ok: true, request_id` | Apps Script answered `OK` |
| 400 | `ok: false, code: invalid_input, field_errors` | Fix the named fields (a filled honeypot gets the same generic answer) |
| 405 / 413 / 415 | `method_not_allowed` / `payload_too_large` / `unsupported_type` | POST only, 16 KB maximum, JSON only |
| 502 | `delivery_unconfirmed, request_id` | Upstream failed or answered unexpectedly |
| 504 | `delivery_unconfirmed, request_id` | The wait expired; receipt is uncertain, not disproven |
| 503 | `service_unavailable` | `INQUIRY_UPSTREAM_URL` missing or invalid |

Every response carries `Cache-Control: no-store`. Values are never echoed;
logs hold a request id and a result code only. There is no rate limit in this
release: the honeypot, validation and size limit are the abuse controls. The
browser handles a 429 if one is added later. Nothing is retried
automatically, and the Apps Script writes the row before it sends email, so a
timeout can follow a stored row: do not promise exactly-once delivery.

### Fields

| Form field | Key sent to Apps Script | Rule |
| --- | --- | --- |
| Name | `name` | required, at most 120 characters |
| Organization | `organization` | optional, at most 200 |
| Work email | `email` | required, practical check, at most 254; personal domains accepted |
| What are you trying to understand or achieve? | `evaluating` | required, 20 to 4,000 characters |
| What kind of decision? | `request_type` plus `decision=` in context | optional: Invest, Position, Develop -> `Assessment`; Screening -> `Screening`; Project inquiry -> `Project`; Not sure or none -> `Other` |
| When do you need to decide? | `timeframe` | optional |
| Relevant public link | `linkedin` (legacy name) | optional http(s), at most 2,048; never fetched |
| How did you find us? | `referral` | optional |
| (from the URL) | `additional_context` | `schema=1; decision=…; interest=…; project=…; research=…; source=…; request_id=…` |

The six original keys keep their sheet columns. `timeframe`, `referral` and
`additional_context` exist in `apps-script.gs` but the old form never sent
them; confirm the deployed script matches before relying on them. Strings
that start with `= + - @` or a tab gain a leading apostrophe so Sheets stores
them as text.

`?interest=` accepts `invest`, `position`, `develop`, and the legacy
`screening`, `assessment`, `project`, `kafwego`, `coppercloud`,
`gate-diagnostic`, `capital-readiness`, `intelligence`, `other`. An explicit
choice in the form always wins over the link. `?research=` accepts the ids
in `RESEARCH_IDS`; `?source=` accepts `research-brief`,
`research-experience`, `advisory`. Anything else is ignored. The visitor sees
the carried context and can remove it.

`apps-script.gs` is a copy of the receiving code for reference. Editing it
here does not change the live deployment.

### Verifying receipt (before release)

Automated tests never contact Google. Before a release, with authorization:

1. Confirm the deployed Apps Script matches `apps-script.gs`, including the
   `timeframe`, `referral` and `additional_context` columns.
2. Set `INQUIRY_UPSTREAM_URL` for the context being tested.
3. Submit one inquiry named `Receipt test <date>` and check both the new
   sheet row and the alert email at sid@motif54.com.

## Privacy posture

No cookies, no analytics, no browser storage. Third-party requests: Google
Fonts on every page, and the Apps Script call made by the function on
submit. `/privacy` describes exactly this; update it in the same change if
anything is added.

## Caching

Only `assets/vendor/` is immutable, and its files keep a version in the
filename. Everything else under `/assets/` revalidates on each load.
Function responses set their own headers in code.

## Tests

Test tooling lives in `tests/` with its own `package.json`, so Netlify never
installs it (a root `package.json` would trigger an install on every deploy).

Unit tests need only Node 22:

```bash
node --test tests/unit/*.test.mjs
```

Browser tests need Playwright 1.63.0 with its Chromium available to Node
(the suite checks the version), plus the pinned tools:

```bash
npm install --prefix tests
```

```bash
node --test --test-concurrency=1 tests/e2e/*.test.mjs
```

The browser suite serves the site with `tests/support/server.mjs`, which
applies the `netlify.toml` rules and mounts the function with a fake Apps
Script. It covers journeys, legacy links, keyboard use, the mobile menu,
reflow at 320px and 200% zoom, no-JS reading, every submission outcome and
axe (WCAG 2.2 AA tags) on every page.

## Local preview

```bash
node tests/support/server.mjs 8788
```

Then open http://127.0.0.1:8788. Extensionless routes, redirects, the 404
page and the inquiry form work; the form talks to a fake Apps Script that
always answers `OK`.

For Netlify's own emulation, run `netlify dev --offline` with the Netlify CLI
from a checkout. Its function runtime rejects a `NODE_OPTIONS` that contains
`--use-openssl-ca`; unset that variable first if your shell sets it. Without
`INQUIRY_UPSTREAM_URL` the function answers 503, which is expected.

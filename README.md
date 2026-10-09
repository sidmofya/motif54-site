# motif54.com

Static marketing site for MOTIF 54. Hand-written HTML, one shared stylesheet,
two small vanilla-JS files. No framework, no build step, no dependencies — the
repository root **is** the published site.

Legal operating entity: **CXB Ventures LLC dba MOTIF 54** (a California LLC).
The public brand is MOTIF 54; the legal name is used only where the operating
entity has to be identified (footer, `/privacy`, `/terms`).

## Positioning

MOTIF 54 builds strategic African projects and the capability around them.

The site is organised around three modes — **Projects · Programs ·
Intelligence** — across three sectors: **AI Infrastructure · Energy · Critical
Minerals**. MOTIF 54 is not presented as a consultancy, fund, training company,
think tank, broker, venture studio, or conference organiser. The operating
model is shown through the work rather than named as a category.

## Routes

Pages are `.html` files at the repository root, linked internally without the
extension. Netlify serves `/projects` from `projects.html`; `netlify.toml`
declares those rewrites explicitly rather than relying on the platform default.

| URL | File | Notes |
| --- | --- | --- |
| `/` | `index.html` | Hero, two doors, the read, projects as evidence, sectors, leadership, closing CTA |
| `/screen` | `screen.html` | The screening retainer; `.card--placeholder` marks the unfilled decline-pile cards |
| `/assess` | `assess.html` | The commissioned assessment; absorbed the Gate Diagnostic and Capital Readiness |
| `/projects` | `projects.html` | `#critical-minerals` and `#ai-infrastructure` anchor the two project cards |
| `/about` | `about.html` | |
| `/work-with-us` | `work-with-us.html` | Enquiry form; accepts `?interest=` |
| `/privacy` | `privacy.html` | Footer-linked only, not in primary nav |
| `/terms` | `terms.html` | Footer-linked only, not in primary nav |

Redirects for retired URLs live in `netlify.toml`. Netlify does not chain
redirects, so each rule points straight at its final destination:
`/programs`, `/intelligence`, `/strategic-asset-intelligence`, `/decision-rooms`,
`/situation-room.html` and `/intelligence-feed.html` → `/assess`,
`/critical-minerals` → `/projects#critical-minerals`,
`/request-access` and `/briefing.html` → `/work-with-us`.

## Design system

Defined once in `assets/style.css`. Do not introduce a second palette or type
stack — reuse the tokens.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` / `--bg-1` / `--bg-2` | `#161518` / `#1B1A1E` / `#222126` | warm charcoal canvas / cards / raised-hover |
| `--bg-edge` | `#0E0D10` | vignette falloff at the viewport edges |
| `--line` / `--line-2` | `rgba(255,255,255,.08)` / `.14` | hairline borders |
| `--fg` / `--fg-muted` / `--fg-dim` | `#F4F4F2` / `#A2A0A6` / `#8C8A93` | headings / body / meta (all AA on every surface) |
| `--accent` | `#D08A5A` | copper — eyebrows, numbers, hover, focus |
| `--accent-2` | `#E36A60` | red — links, bullets, errors |
| `--font-display` | Space Grotesk | headings and body |
| `--font-mono` | JetBrains Mono | eyebrows, buttons, nav, footer |
| `--container` | `1100px` | page width |
| `--r-btn` / `--r-card` | `3px` / `5px` | the site is near-sharp-cornered |

Conventions worth knowing before editing:

- **Never type `//` in an eyebrow.** `.eyebrow::before` supplies it (a copper
  `+` in page heroes).
- Copper is structure, red is emphasis. Don't swap them.
- Sections are separated by `<hr/>` (64px rhythm), not by a wrapper class.
- Zero shadows, zero CSS keyframes. CSS transitions are `200ms ease` on
  `color`, `border-color`, `background`, plus the link-arrow nudge and the
  card spotlight.
- Depth comes from blur and falloff, never shadows. The canvas is charcoal,
  not black, with a fixed vignette (`body::after`) and the 64px blueprint
  grid (`body::before`) masked so it fades toward the edges. On the homepage
  a ghosted Africa (`assets/img/africa.svg`) and an out-of-focus M54 ring
  (`assets/img/m54-ring.svg`) sit behind the content. Their blur is baked
  into the SVGs, so it is rasterised once. `<main>` spans the viewport and
  clips horizontally so these layers crop at the screen edge.
- The nav is sticky glass: translucent `--bg` with a 6px backdrop blur.
  `html { scroll-padding-top }` keeps anchors clear of it.
- The orb (`assets/orb.js`, homepage only) is the one luminous element: the
  M54 ring as a particle field, lit from lower left, copper at the notch,
  with copper grains shimmering through the white. It
  tilts toward the pointer, particles near the pointer brighten and part,
  and a small card cycles the three sectors. It redraws at 30fps and stops
  when offscreen. With reduced motion it draws one still frame. With JS off
  a thin static ring shows.
- Scroll and load motion lives in `assets/motion.js` and stays quiet: the
  hero headline rises line by line, eyebrows decode once on entry, section
  rules and row rules draw left to right, cards and section headings come
  into focus from a 6px blur, the nav mark's ring draws on the homepage, the
  ghosted layers and orb lag the scroll for parallax (farther lags more), and
  Lenis lightly smooths wheel scrolling.
  All of it is off under `prefers-reduced-motion: reduce`. Start states are
  set from JS only, so the page is complete with JS off or a library
  blocked. `/privacy` and `/terms` don't load it.
- Body copy is `--fg-muted`; only headings, `.lead`, `.filter` and `strong`
  go bright.
- Two type scales run in parallel: display/body in Space Grotesk (17.5px base,
  `.lead` at 18–22px) and UI chrome in JetBrains Mono (12–14px — nav, buttons,
  eyebrows, card labels, footer). Keep the gap between them; scaling one
  without the other flattens the design.
- The nav collapses to a disclosure below 900px. The five-item horizontal nav
  needs ~704px and stops fitting before that, so don't lower the breakpoint
  without re-measuring (`.nav-toggle` / `#nav-menu`, plus `assets/nav.js`).

## Adding a project or a program

Project, door, and CTA cards use one shared markup shape, and the grid
(`.card-grid`) derives its column count from the number of cards — two cards
render as two columns, three as three, with no CSS change. To add a third
project, copy an existing `<article class="card">` block and edit it in **both**
places it appears:

- `index.html` — the "Evidence" grid (featured entries)
- `projects.html` — the full listing

```html
<article class="card" id="anchor-slug">
  <div class="card-label">Sector or audience</div>
  <h3>Name</h3>
  <p>One short paragraph.</p>
  <div class="card-cta"><a class="link-mono" href="/…">Call to action &rarr;</a></div>
</article>
```

For an external destination, add `target="_blank" rel="noopener"` and the
`<span class="visually-hidden"> (opens in a new tab)</span>` suffix used by the
CopperCloud link.

## Motion libraries

`assets/vendor/` holds pinned, minified copies, version in the filename
because `/assets/*` is served `immutable`:

- GSAP 3.15.0 with ScrollTrigger, SplitText, ScrambleTextPlugin and
  DrawSVGPlugin (GSAP's no-charge standard licence; all plugins are free).
- Lenis 1.3.26. Its stylesheet rules are folded into the end of the
  `MOTION` block in `assets/style.css`.

To upgrade, copy the new `dist/*.min.js` files in under new versioned names,
strip the `sourceMappingURL` comment, and update the `<script>` tags on the
six pages that load them. Remove the Lenis `<script>` tag on every page to
drop smooth scrolling; nothing else depends on it.

## The enquiry form

`work-with-us.html` posts to a Google Apps Script web app (endpoint in
`assets/form.js`). `apps-script.gs` is the receiving code — paste it into the
Apps Script editor; it is not deployed from this repository.

Field names are deliberately unchanged from the previous form so the Google
Sheet column order still lines up: `request_type`, `name`, `organization`,
`email`, `evaluating`, `linkedin`. The columns the current form no longer
collects (role, geography, sector, timeframe, decision makers, referral,
additional context) are simply left blank.

`?interest=` preselects the engagement type. Accepted values are mapped in
`INTEREST_MAP` in `assets/form.js`: `screening`, `assessment`, `project`,
`kafwego`, `coppercloud`, `other`. The retired keys `gate-diagnostic`,
`capital-readiness` and `intelligence` are kept pointing at `Assessment` so
inbound links from before the two-door rewrite still land on a live type.

Because the POST uses `mode: 'no-cors'`, the response is opaque and the form
always shows the success state. There is no readable failure path.

## Privacy posture

The site sets **no cookies** and runs **no analytics**. The only third-party
requests are Google Fonts on every page and the Apps Script endpoint on form
submit. GSAP and Lenis are self-hosted in `assets/vendor/` for the same
reason; keep them there rather than switching to a CDN. `motion.js` stores
nothing on the device. `/privacy` says exactly that — if analytics or any
tracking technology is ever added, update that page in the same change.

## Local preview

Root-relative asset paths mean `file://` will not work; serve it:

```sh
python3 -m http.server 8000
```

Extensionless URLs will 404 under a plain static server (they resolve on
Netlify). Visit `/projects.html` locally, or use a server that falls back to
`.html`.

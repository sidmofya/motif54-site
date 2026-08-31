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
| `/` | `index.html` | Hero, three modes, projects, programs, intelligence, sectors, thesis, leadership, closing CTA |
| `/projects` | `projects.html` | `#critical-minerals` and `#ai-infrastructure` anchor the two project cards |
| `/programs` | `programs.html` | |
| `/intelligence` | `intelligence.html` | Three lenses + Gate Diagnostic |
| `/about` | `about.html` | |
| `/work-with-us` | `work-with-us.html` | Enquiry form; accepts `?interest=` |
| `/privacy` | `privacy.html` | Footer-linked only, not in primary nav |
| `/terms` | `terms.html` | Footer-linked only, not in primary nav |

Redirects for retired URLs live in `netlify.toml`:
`/strategic-asset-intelligence` and `/decision-rooms` → `/intelligence`,
`/critical-minerals` → `/projects#critical-minerals`,
`/request-access` and `/briefing.html` → `/work-with-us`.

## Design system

Defined once in `assets/style.css`. Do not introduce a second palette or type
stack — reuse the tokens.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` / `--bg-1` / `--bg-2` | `#0A0A0C` / `#0E0E12` / `#15151B` | canvas / cards / raised-hover |
| `--line` / `--line-2` | `rgba(255,255,255,.08)` / `.14` | hairline borders |
| `--fg` / `--fg-muted` / `--fg-dim` | `#F4F4F2` / `#A2A0A6` / `#817F88` | headings / body / meta |
| `--accent` | `#D08A5A` | copper — eyebrows, numbers, hover, focus |
| `--accent-2` | `#E36A60` | red — links, bullets, errors |
| `--font-display` | Space Grotesk | headings and body |
| `--font-mono` | JetBrains Mono | eyebrows, buttons, nav, footer |
| `--container` | `1100px` | page width |
| `--r-btn` / `--r-card` | `3px` / `5px` | the site is near-sharp-cornered |

Conventions worth knowing before editing:

- **Never type `//` in an eyebrow.** `.eyebrow::before` supplies it.
- Copper is structure, red is emphasis. Don't swap them.
- Sections are separated by `<hr/>` (64px rhythm), not by a wrapper class.
- Zero shadows, zero keyframes. The only transition is `200ms ease` on
  `color`, `border-color` and `background`. The body carries a fixed 64px
  blueprint grid — that combination is the brand.
- Body copy is `--fg-muted`; only headings, `.lead`, `.filter` and `strong`
  go bright.

## Adding a project or a program

Project and program cards use one shared markup shape, and the grid
(`.card-grid`) derives its column count from the number of cards — two cards
render as two columns, three as three, with no CSS change. To add a third
project, copy an existing `<article class="card">` block and edit it in **both**
places it appears:

- `index.html` — the "Selected projects" / "Programs" grid (featured entries)
- `projects.html` or `programs.html` — the full listing

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
`INTEREST_MAP` in `assets/form.js`: `project`, `kafwego`, `coppercloud`,
`program`, `partner-room`, `capital-readiness`, `gate-diagnostic`,
`intelligence`, `other`.

Because the POST uses `mode: 'no-cors'`, the response is opaque and the form
always shows the success state. There is no readable failure path.

## Privacy posture

The site sets **no cookies** and runs **no analytics**. The only third-party
requests are Google Fonts on every page and the Apps Script endpoint on form
submit. `/privacy` says exactly that — if analytics or any tracking technology
is ever added, update that page in the same change.

## Local preview

Root-relative asset paths mean `file://` will not work; serve it:

```sh
python3 -m http.server 8000
```

Extensionless URLs will 404 under a plain static server (they resolve on
Netlify). Visit `/projects.html` locally, or use a server that falls back to
`.html`.

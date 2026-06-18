# motif54-site

The MOTIF 54 website — an editorial, capital-facing static site.

> **Africa's strategic assets. Made legible.**
> A trusted decision layer for Africa's strategic assets — critical minerals, energy,
> infrastructure, and emerging compute.

MOTIF 54 is positioned as a decision and coordination platform for capital allocators
(family offices, infrastructure funds, resource investors, sovereign and development
capital, strategic corporates). The homepage frames three capabilities — **Strategic Asset
Intelligence**, **Project Verification**, and **Decision Rooms** — a five-part verification
framework, and live strategic asset cases (**CopperCloud**, **Kafwego**). Three calls to
action route to the Request Access form: *Request an Intelligence Briefing*, *Submit an
Opportunity*, *Join a Decision Room*.

The Critical Minerals page is the **public layer** only: it routes to the Request Access
form ("Critical Minerals investor briefing"). The qualified-investor gate, data room,
pipeline, and terms are a future phase and intentionally not on the public site.

## Stack

Pure static HTML + one shared CSS file + a small amount of vanilla JS. No build step, no
dependencies, no framework. Fonts are loaded from Google Fonts; the access-request form
posts to a Google Apps Script web app.

## Structure

```
index.html                          Home (10-section platform IA)
strategic-asset-intelligence.html   Strategic Asset Intelligence (was intelligence-feed.html)
decision-rooms.html                 High-Consequence Decision Rooms (was situation-room.html)
critical-minerals.html              Critical Minerals Investment Access
projects.html                       Live Strategic Asset Cases (CopperCloud, Kafwego)
about.html                          About
request-access.html                 Request Access (form; ?type= pre-selects an intent)
briefing.html                       Redirect → request-access.html (legacy link)
assets/style.css                    Shared stylesheet (design tokens, nav, footer, components)
apps-script.gs                      Google Apps Script that receives the form POST
```

## Design system

Defined as CSS custom properties in `assets/style.css`:

| Token          | Value     | Use                         |
|----------------|-----------|-----------------------------|
| `--paper`      | `#F5F5F0` | warm off-white background    |
| `--ink`        | `#1A1A1A` | charcoal text                |
| `--muted`      | `#6B6B6B` | secondary text / hairlines   |
| `--accent`     | `#9C6644` | muted copper                 |
| `--accent-deep`| `#7E4F33` | darker copper (hover)        |
| `--soft`       | `#ECECE7` | callout / highlight bg       |

Typography: Libre Baskerville (serif, authority), Inter (sans, clarity), JetBrains Mono
(systems). Mobile-first; breakpoints at 900 / 700 / 600px.

## Local preview

```
python3 -m http.server 8000
# then open http://localhost:8000/
```

Use a server (not `file://`) so the root-relative `/assets/style.css` and page links
resolve.

## Request Access form

`request-access.html` posts (`no-cors`) to the Apps Script `ENDPOINT` defined inline in
that page. To wire up your own backend:

1. Open the target Google Sheet → Extensions → Apps Script.
2. Paste the contents of `apps-script.gs`.
3. Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
4. Copy the deployment URL into the `ENDPOINT` variable in `request-access.html`.

Sheet column order and the alert-email recipient are documented at the top of
`apps-script.gs`.

## Deploy (Netlify)

The repo is deploy-ready via `netlify.toml` (no build step; publishes the repo root).
Recommended: **Git-based continuous deploy** so every push to the production branch ships.

1. In Netlify → **Add new site → Import an existing project** → connect this GitHub repo.
2. Build settings auto-fill from `netlify.toml` (build command empty, publish dir `.`).
   Choose the production branch (e.g. `main`).
3. Deploy. Then **Domain settings → Add custom domain → `motif54.com`** and point DNS
   (Netlify DNS, or an `ALIAS`/`A` + `CNAME www`) per Netlify's instructions; HTTPS is
   provisioned automatically.

`netlify.toml` also 301-redirects the legacy `/briefing.html`, `/situation-room.html`, and
`/intelligence-feed.html` to their current destinations, and sets basic security +
asset-caching headers.

## Notes

- Copy reflects the **decision-layer repositioning** (investor/decision voice; identify,
  verify, access). Earlier "capital intelligence studio / Intelligence Feed / Situation
  Room" framing has been retired.

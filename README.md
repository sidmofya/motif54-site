# motif54-site

The MOTIF 54 website — an editorial, capital-facing static site.

> **Capital intelligence for Africa's next strategic stack.**
> Energy. Minerals. Compute. Capital. Sovereignty.

MOTIF 54 surfaces two offers — the **MOTIF 54 Intelligence Feed** and the **Africa
Situation Room** — and points to two live projects (**CopperCloud**, **Kafwego**) as
proof points, not offers.

## Stack

Pure static HTML + one shared CSS file + a small amount of vanilla JS. No build step, no
dependencies, no framework. Fonts are loaded from Google Fonts; the access-request form
posts to a Google Apps Script web app.

## Structure

```
index.html              Home
intelligence-feed.html  MOTIF 54 Intelligence Feed
situation-room.html     Africa Situation Room
projects.html           Live Projects (CopperCloud, Kafwego)
about.html              About
request-access.html     Request Access (form)
briefing.html           Redirect → request-access.html (legacy link)
assets/style.css        Shared stylesheet (design tokens, nav, footer, components)
apps-script.gs          Google Apps Script that receives the form POST
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

`netlify.toml` also 301-redirects the legacy `/briefing.html` to `/request-access.html`
and sets basic security + asset-caching headers.

## Notes

- Site copy is **v0.1 temporary design copy** — voice will be sharpened in a later pass.

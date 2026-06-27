# Outreach engine — personalized 1:1 microsites

A self-hosted version of the "personalized outreach page" tool (the use60-style
1:1 microsite), built into this static site. Each prospect gets a private link at
**`motif54.com/r/<code>`** with copy, a personal video, and a numbered argument
written around *their* deal — then a view beacon tells you when they open it.

This is a **top-20–50-accounts** tool, not bulk send. Its value is bottlenecked by
how real your research is — the specificity is the persuasion. One generic page
converts no one.

## How it fits the existing stack

Pure static output on Netlify + the existing Google Apps Script backend. The only
build step is `build.mjs`, which renders `/r/<code>/index.html` from a per-recipient
JSON. No framework, no server to run the pages.

```
brief.json ──(draft.mjs, Claude)──► recipients/<code>.json ──(edit by hand)
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                                          ▼
                  build.mjs (static page)                 video/render.mjs (Remotion)
                  reuses /assets/style.css                 name slides + 1 real take
                         │                                          │
                         ▼                                          ▼
                  /r/<code>/index.html  ◄──── embeds ────  /r/<code>/video.mp4
                         │
                  Netlify → motif54.com/r/<code>   (noindex; see ../netlify.toml)
                         │
              on view: beacon ─► Apps Script ─► Google Sheet "Views" + email alert
```

## Files

| Path | What it does |
|------|--------------|
| `recipients/<code>.json` | One prospect's data (the source of truth for their page). |
| `template.html` | The dark page template; reuses the site's design tokens. |
| `build.mjs` | Renders every recipient into `/r/<code>/index.html`. |
| `draft.mjs` | Drafts the copy in the MOTIF 54 voice from a research brief via Claude. |
| `video/` | Remotion project: per-recipient name slides + one recorded take → `video.mp4`. |

## Workflow

### 1. (Optional) draft the copy with Claude
Write a brief with real research, then:
```bash
ANTHROPIC_API_KEY=... node outreach/draft.mjs brief.json
```
This writes `recipients/<code>.json`. **Read and edit it** — fix any fact the model
guessed, tighten the voice. You can also skip this and hand-write the JSON (see
`recipients/cf01.json` as a worked example).

### 2. Build the page
```bash
node outreach/build.mjs
python3 -m http.server 8000   # then open http://localhost:8000/r/cf01/
```

### 3. (Optional) render the personal video
The page works without it (the `<video>` just won't have a source). To add it:
```bash
cd outreach/video && npm install
# record ONE take → outreach/video/public/take.mp4  (see video/README.md)
node outreach/video/render.mjs            # → /r/<code>/video.mp4
```

### 4. Turn on tracking (once)
- Add the view-event branch from `../apps-script.gs` to your Apps Script web app
  (it auto-creates a "Views" sheet and emails you on open).
- Set `OUTREACH_TRACKING_ENDPOINT` to the web-app URL in the Netlify site env. The
  beacon is injected at build; commit-time pages stay clean (no endpoint baked in).

### 5. Ship
Push to the production branch. Netlify runs `node outreach/build.mjs` and publishes
`motif54.com/r/<code>` (marked `noindex`). Send the prospect the link.

## Notes
- **Hosting on the real domain** (not a third-party tracking subdomain) is the main
  reason to own this — it converts better and reads as less spammy in cold email.
- Keep `/r/<code>/` slugs unguessable if a page is sensitive; they're `noindex` but
  not access-controlled.
- Video is the highest-effort piece and can ship a step behind the page.

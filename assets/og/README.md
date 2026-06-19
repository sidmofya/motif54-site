# Social share image (Open Graph / Twitter)

`motif54-og.png` (1200×630) is the link-preview image referenced by `og:image` /
`twitter:image` in every page `<head>`. It is generated from `og-image.html` so the text
stays editable and renders in the real Space Grotesk / JetBrains Mono fonts.

## Regenerate after editing `og-image.html`

Rendered with headless Edge/Chromium (classic `--headless`, which reliably writes a file;
`--headless=new` does not). From the repo root:

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=6000 \
  --screenshot="C:/Users/sidmo/Websites/motif54-site/assets/og/motif54-og.png" \
  "file:///C:/Users/sidmo/Websites/motif54-site/assets/og/og-image.html"
```

`--virtual-time-budget` gives the web fonts time to load before the screenshot.
Any headless Chromium (Chrome, Edge) works.

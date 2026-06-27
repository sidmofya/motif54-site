# Outreach video (Remotion)

Renders the personalized video note: on-brand **name/title slides** composited with
**one pre-recorded talking-head take** of you in a corner bubble — exactly the format
in the use60 reference. No AI avatar; you record one take and reuse it across every
recipient. Only the slide text changes per prospect.

## Setup

```bash
cd outreach/video
npm install
```

## Record the one take

- Vertical (portrait), ~25–35 seconds, framed for a circular crop (centre your face).
- Look at the camera; speak to "you" generically (no names — the *slides* carry the
  name, so one take serves everyone).
- Save it as **`outreach/video/public/take.mp4`** (H.264 mp4). It's git-ignored.

The composition auto-sizes its duration to the take, and divides it evenly across the
recipient's `video_slides`.

## Preview / render

```bash
npm run studio                      # live preview in Remotion Studio
node render.mjs                     # render every recipient → /r/<code>/video.mp4
node render.mjs cf01                # just one
```

`render.mjs` reads each `outreach/recipients/<code>.json` `video_slides` and passes
them in as props, writing `/r/<code>/video.mp4` next to that recipient's page.

## What to tweak

- Look & motion: `src/OutreachVideo.tsx` (colours match `assets/style.css` tokens —
  near-black `#0A0A0C`, copper `#D08A5A`, Space Grotesk).
- Dimensions / fps / default slides: `src/Root.tsx`.

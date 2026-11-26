# Release-one candidate: review package

Prepared 25 November 2026 against the MOTIF 54 build brief v1.0. This is a
reviewable candidate, not a release: nothing was merged, deployed or
submitted to the live inquiry receiver. The `docs/` folder is blocked from
publication by the publish guard in `netlify.toml`.

## Candidate identity

| Repository | Starting revision (= production) | Candidate |
| --- | --- | --- |
| `sidmofya/motif54-site` | `697d993ec6e0de348189afc9b3a4742f60a4f48e`, deploy `6ac8b7fa324e3600082a5964` | branch `claude/nifty-wright-n599k6`; this file ships in the candidate commit |
| `sidmofya/massbal_intelligence` | `cf78bafc8a0c36076ad79b50ebd22a007c554c8b`, deploy `6afb54c88b927ef9ae3713ef` | branch `claude/nifty-wright-n599k6` at `3ad8af9` |
| `sidmofya/sidmofya` | unchanged (read-only, as the brief requires) | none |

Both production deploys were re-read from Netlify before work started and
matched these revisions. The live homepage matched `index.html` byte for
byte. Research `main` had no commits beyond the deployed revision.

## What changed

- **Positioning and journey.** New homepage (hero and dependency map,
  featured intelligence first, Invest/Position/Develop, approach, practice
  evidence, closing), intelligence index, two decision briefs, Advisory,
  Approach and 404 pages. About and Projects rewritten within their verified
  claims. Screen and Assess keep their content under new navigation.
- **Navigation.** Intelligence · Advisory · About · Start a conversation on
  every page; identical header and footer, enforced by test.
- **Inquiry.** The browser no longer posts `no-cors` and claims success. A
  same-origin Netlify function validates, forwards allowlisted fields to the
  existing Apps Script and reports "received" only on its `OK`. Every failure
  keeps the visitor's text and offers email.
- **Routes.** `/intelligence` serves the index again (two forced 301s
  removed); five explicit rewrites added; every legacy redirect kept; a
  publish guard now hides `README.md`, `apps-script.gs` and all repository
  folders, which production serves publicly today.
- **Research site.** Attributed MOTIF return links on the model footer, About,
  Research and the copper Install scene, on a separate branch.
- **Motion.** Lenis smooth scrolling, the canvas particle orb and the hero
  text reveal are gone; the remaining quiet motion is optional and
  reduced-motion aware.
- **Privacy.** Section 6 describes the function hop, the reference number,
  and the removable research label. Last updated 25 November 2026.

## Evidence

| Check | Result | Where |
| --- | --- | --- |
| Unit tests (schema, adapter contract, routes, pages, evidence record) | 64 pass | `node --test tests/unit/*.test.mjs` |
| Browser tests (journeys, legacy links, keyboard, mobile menu, 320px and 200% zoom reflow, no-JS, every submission outcome, axe WCAG 2.2 AA on 14 pages at 1280 and 390px) | 21 pass | `node --test --test-concurrency=1 tests/e2e/*.test.mjs` |
| Mutation checks: planted defects in the adapter, guard, anchors, interest map, brief CTA and form in-flight guard | every one caught | session log |
| `netlify dev --offline` (CLI 27.16.2): manifest routes, trailing slashes, query preservation, guards, 404, function 405/415/400/413/503 | 51 of 51 | `netlify-dev-routes.txt` |
| `netlify build --offline`: function bundled by nft for `nodejs22.x`, shared schema inlined; the packaged file run directly returns 400 and 503 as specified | pass | session log |
| Lighthouse 13.6.0 mobile, three cold runs per page, gzip | all six required pages: score 99 to 100, LCP 1.45 to 1.65 s, CLS at most 0.004, TBT at most 22 ms, at most 132 KB transferred, at most 64 KB JS | `lighthouse-summary.txt` |
| Baseline under the same profile | old homepage 93, TBT 302 ms; old inquiry page 100 | `lighthouse-summary.txt` |
| Research links on MOTIF pages | 9 of 9 return 200 live; both hash states open the intended view | `research-links.txt` |
| Research repository suites | 314 Python tests (307 existing plus 7 new), Node model test and copper browser suite pass, as on the unmodified baseline | research branch |
| Research CTA placement | visible in 3D start, explore, copper view, loss diagram and no-WebGL fallback at 1440 and 390px; overlaps no control; hidden in copper presentation mode | session screenshots |

Screenshots at 1440, 768, 390 and 320px of every page, the baseline captures
and raw Lighthouse JSON were delivered with the session, not committed.

## Claim and source register

| Claim on MOTIF pages | Basis |
| --- | --- |
| Sid Mofya: founder; former Executive Director, Draper Venture Network; former Process Technologist, Royal Dutch Shell; Kauffman Fellow; chemical engineer by training | Existing public site at `697d993` (not independently re-verified, D05) |
| CXB Ventures LLC dba MOTIF 54 | Existing footer, privacy and terms (not independently re-verified, D05) |
| CopperCloud and Kafwego descriptions | Existing project copy, unchanged (D05) |
| Research by Sid Mofya | ai.sidmofya.com About page |
| One gigawatt of commissioned IT electrical capacity; hypothetical plant; not an operating facility | ai.sidmofya.com research guide and model |
| Run 04 estimates cover partial equipment scope; low/base/high are design cases | ai.sidmofya.com/research.html, "How to read the results" |
| Buildings, offsite infrastructure and unresolved equipment are not counted as zero | research guide and the Run 04 coverage record |
| Copper journey: five scenes, Zambian examples, representative manufacturing, conditional quantities, throughput not lead time | ai.sidmofya.com/copper/ and its source register |
| Copper evidence reviewed 16 November 2026 | the exhibit's own footer |
| Advisory outputs, Industrial Bottleneck Review, ways to work, process, approach commitments | Proposed copy from the brief, pending D01 |

No research quantity appears on any MOTIF page (test-enforced).

## Decisions and release dependencies

| Item | Status |
| --- | --- |
| D01 Offer scope and language | **Open.** Copy is the brief's proposal. Sid approves the offers, the Bottleneck Review and the approach commitments. |
| D02 Research attribution and reuse | **Open.** Original line drawings used instead of research stills. Sid confirms the MOTIF links on the research site. |
| D03 Inquiry operations | **Open.** Confirm the deployed Apps Script matches `apps-script.gs` (including `timeframe`, `referral`, `additional_context`), set `INQUIRY_UPSTREAM_URL`, run one labelled live receipt test checking the sheet row and the email, and confirm sid@motif54.com is monitored (it is newly shown on the site). |
| D04 Measurement | Default kept: no analytics. Record source and outcomes manually. |
| D05 Project and founder claims | **Open.** Claims kept at their existing public wording. |
| D06 Release operations | **Open.** Record rollback targets and who can restore them. |

## Release sequence and rollback

1. Set `INQUIRY_UPSTREAM_URL` (Functions scope) on the `motif54` project.
2. Merge the MOTIF branch; verify the deploy's commit, every route in
   `docs/baseline/route-manifest.json` on the live host, the guards, and one
   labelled receipt test.
3. Only then merge the research branch, so its links never point at missing
   pages; verify the model footer, About, Research and the copper Install
   scene live.
4. Retest the full journey: research site to MOTIF inquiry and back.

Rollback targets until newer deploys exist: MOTIF `6ac8b7fa324e3600082a5964`,
research `6afb54c88b927ef9ae3713ef`. Roll back the research site first if
MOTIF is rolled back. Triggers: failed receipt, routing errors, private data
exposure, canonical errors, critical mobile or keyboard regressions.

## Not done or blocked

- Live receipt test (sheet row and email): needs D03 authorization and inbox access.
- Hosted verification of routes, headers and the function on real Netlify: no preview was published.
- Three independent human comprehension checks and a physical-mobile spot check.
- Screen-reader testing with assistive technology (axe and keyboard checks only).
- Field Core Web Vitals: available only after launch.
- Independent evaluation against `MOTIF54-Codex-Acceptance-Rubric.md`, which was not supplied.

# Allocation + Propagation: Who's Doing It Well in Public

> **Internal research note — MOTIF 54.** Not a published site page.
> Prepared June 2026. Sources are linked inline and consolidated at the end.

---

## 1. The thesis, sharpened

The working premise: **at a high level, production is now basically free.** AI-assisted
building has collapsed the cost of turning a clear spec into working software. When the
expensive step gets cheap, the bottleneck moves to the two steps on either side of it:

- **A. Allocation — *what* to build.** The scarce act is choosing well, so you don't spend
  cheap-but-not-zero production on work that (1) isn't valuable, (2) already exists, or
  (3) is *easily built by your ICP* themselves.
- **B. Propagation — *how* it reaches people.** Once built, the work has to find enough of
  the right people that production + distribution is net profitable.

These aren't new names. The field already calls bottleneck A **taste / curation** and
bottleneck B **distribution**. What's new is the *ratio*: as production → 0, the share of
total value created by allocation and propagation → 100%.

**The load-bearing insight is filter (3).** "Already exists" (2) is the old commodity trap.
"Easily built by your ICP" (3) is the *new* one, and it's sharper: if production is free for
you, it's nearly free for your customer too. So anything **legible enough to be fully
specced is, by definition, easily built by whoever wants it.** Durable allocation therefore
migrates to the things that *resist* a clean spec:

- **Taste / judgment** — knowing which of a thousand buildable things is worth building.
- **Proprietary data or access** — inputs the ICP can't regenerate on demand.
- **Hard-to-spec work** — problems where the difficulty is in *figuring out what the problem
  is*, not in typing the solution.

(That third bucket is congruent with MOTIF 54's own stance — working "upstream of
transactions… where theses, mandates, and narratives are shaped" is precisely a bet that the
hard-to-spec, relationship- and judgment-bound layer is where durable value sits.)

The builders below are sorted by how cleanly they embody *both* halves at once, in public,
with something forkable left behind.

---

## 2. Builder profiles

### Simon Willison — the cleanest fit, and the most directly useful repo

- **Who / ships / cadence.** Co-creator of Django; now builds open-source LLM tooling on a
  near-daily public cadence. Active through 2026 — `llm` 0.32a, `llm-tools-edit`
  (Mar 2026), and a new Datasette Agent shipping in the same window.
  ([entries feed](https://simonwillison.net/entries/))
- **Allocation method.** Build the smallest genuinely-useful tool for a problem he *actually
  hit*, then generalize only if it earns it. His LLM work is a plugin architecture: each new
  capability is a small, separable bet rather than a monolith. Low cost-per-bet is the whole
  design.
- **Propagation method.** *Write up everything.* Every shipped thing gets a post you can
  inspect, rerun, or critique — he's become one of the clearest no-hype explainers of applied
  AI, and the blog is the distribution engine, not a side activity. The discipline is the
  moat: legible work, published relentlessly, compounds into authority that's expensive to
  replicate. ([github.com/simonw/llm](https://github.com/simonw/llm))
- **Repo(s) to work off of.**
  - **[`simonw/til`](https://til.simonwillison.net/)** — the most relevant to *our*
    propagation gap. A "Today I Learned" repo where each markdown note triggers a GitHub
    Action that rebuilds a self-updating README index and publishes a searchable
    [Datasette](https://github.com/simonw/datasette) site. **Shipping a note *is* publishing
    it.** ([how the self-rewriting README works](https://simonwillison.net/2020/Apr/20/self-rewriting-readme/))
  - **[`simonw/llm`](https://github.com/simonw/llm)** / **[`simonw/datasette`](https://github.com/simonw/datasette)**
    — production tools, plugin-extensible, good to build *on*.
- **The one transferable lesson.** The cheapest durable distribution moat is a *system* that
  turns each unit of shipping into an indexable, public, forkable artifact — automatically.

### Andrej Karpathy — repos engineered to be forked

- **Who / ships / cadence.** Founding OpenAI, ex-Tesla AI; now ships compact, legible
  educational repos. `nanochat` landed Oct 2025 ("the best ChatGPT that $100 can buy,"
  ~8k hand-written lines) with a Feb 2026 follow-up post on beating GPT-2 for <$100, plus
  `autoresearch` (agents running overnight experiments on nanochat training).
  ([github.com/karpathy/nanochat](https://github.com/karpathy/nanochat),
  [autoresearch](https://github.com/karpathy/autoresearch))
- **Allocation method.** *Allocation as pedagogy* — build the **minimal legible thing** that
  teaches the core mechanism. The constraint ("$100," "single file," "from scratch") is the
  allocation discipline: it forces out everything that isn't load-bearing.
- **Propagation method.** The repo *is* the artifact and the legibility *is* the
  distribution — a clean from-scratch implementation gets forked, ported (Colab versions,
  community rewrites), and taught. He narrates the build on X to seed it.
  ([the nanochat journey](https://x.com/karpathy/status/1977755427569111362))
- **Repo(s) to work off of.** `nanochat`, `nanoGPT`, `llm.c`, `micrograd`, `autoresearch` —
  all explicitly designed to be read, run, and forked.
- **The one transferable lesson.** A self-imposed constraint ("the cheapest version that
  still works") is an allocation *tool* — and the *minimal legible build* is its own best
  marketing. Worth noting: the man who coined "vibe coding" hand-wrote nanochat because the
  agents "didn't work well enough at all" *for that job* — allocation includes knowing when
  free production isn't yet good enough.

### Geoffrey Huntley — the most on-thesis voice on "production is free"

- **Who / ships / cadence.** Australian engineer who became prominent in 2025 for the
  **"Ralph" technique** — a coding agent in an infinite Bash `while` loop, using the
  filesystem (not chat history) as memory, feeding its own errors back in. Publicly released
  July 2025; documented openly at [ghuntley.com](https://ghuntley.com/).
- **Allocation method.** His allocation bet is *meta*: the thing worth building is the
  *machine that builds*. If production is free, industrialize it further and arbitrage the
  gap between what production costs you and what it's priced at — e.g. a "$50k contract
  delivered for $297," "6 repos shipped overnight."
  ([ghuntley.com/ralph](https://ghuntley.com/ralph/))
- **Propagation method.** Blog the entire method in the open, name it memorably ("Ralph
  Wiggum"), and let the provocation travel. The naming is deliberate propagation craft.
  ([everything is a ralph loop](https://ghuntley.com/loop/))
- **Repo(s) to work off of.** No single canonical repo — Ralph is a *pattern* (a short Bash
  loop + a prompt file), reproduced from the blog. Treat the writeups as the spec.
- **The one transferable lesson.** If your premise is "production is free," the highest-
  leverage allocation may be to **automate production itself** and sell the delta — and an
  ownable *name* for a technique is distribution.

### Pieter Levels — allocation + propagation at the *business* level (no repos)

- **Who / ships / cadence.** The archetypal solo indie hacker — Nomad List, Remote OK, plus
  a long tail of experiments; reported $3M+/yr solo. Tempo: prototype in hours, ship in
  24–72h, improve live. In 2025 he used AI tooling to build a viral flight sim in ~3 hours.
  ([profile/breakdown](https://www.systemscowboy.com/pieter-levels-indie-hacker-strategy/))
- **Allocation method.** Maximize *shots on goal* with ruthless kill criteria — many cheap
  bets, double down only on what shows traction. Validate demand *before* polishing
  production; momentum over perfection.
- **Propagation method.** **Audience-as-distribution.** A large public following turns every
  launch into instant reach; building in public is the marketing. The audience is the asset
  that makes the next bet cheap to propagate.
- **Repo(s) to work off of.** ⚠️ **None — closed source** (famously vanilla PHP/jQuery).
  Read Levels for the *judgment and operating tempo*, not for code.
- **The one transferable lesson.** When production is cheap, **owned audience is the
  compounding asset**: it converts allocation bets into propagation for free. Build the
  audience deliberately, in public, before you need it.

### swyx (Shawn Wang) — the canonical *propagation* doctrine

- **Who / ships.** Author of **"Learn in Public,"** the essay that named bottleneck B for a
  generation of developers; coined "The Rise of the AI Engineer" (2023) and built AI Engineer
  (a conference that sold out at a 10:1 applicant ratio and grew to 3,000+ attendees) and
  Latent Space on top of it. ([swyx.io](https://www.swyx.io/),
  [How to Thought Lead, 2026](https://www.swyx.io/lead))
- **Allocation method.** Spot and *name* an emerging category before consensus ("AI
  Engineer"), then build the media + events that define it. Allocation by *naming the
  lane you'll own*.
- **Propagation method.** Learn/build in public as a deliberate flywheel: share the work and
  the learning, and the audience + opportunities compound back. His own career is the proof.
- **Repo(s) to work off of.** No standout product repo — swyx is the **doctrine and
  distribution** reference, not the code reference. (His site is open source if you want the
  publishing setup.)
- **The one transferable lesson.** Propagation isn't an afterthought to production — it's a
  *practice* you run continuously, and **naming a category is one of the highest-leverage
  allocation moves available.**

### Geoffrey Litt — the allocation edge case that filter (3) implies

- **Who / ships.** HCI PhD (MIT), ex-Ink & Switch, now at Notion; works on AI-assisted
  programming and **"malleable software."** Co-authored the 2025 Ink & Switch manifesto
  *Malleable Software: Restoring User Agency in a World of Locked-Down Apps.*
  ([essay](https://www.inkandswitch.com/essay/malleable-software/),
  [geoffreylitt.com](https://www.geoffreylitt.com/))
- **Allocation method.** Build software for an *audience of one* (often yourself) and make it
  *reshapeable* — the opposite of one-size-fits-all SaaS. This is the direct corollary of
  filter (3): **if the ICP can cheaply build it themselves, the durable frontier is personal,
  reshapeable software**, not another rigid app they could have generated.
- **Propagation method.** Research essays + public prototypes (Potluck, Embark, Wildcard).
  Propagation through *ideas and demos* that shift how others think, more than through a
  shipped product.
- **Repo(s) to work off of.** Research prototypes are public via Ink & Switch / his site;
  treat as references/inspiration rather than turnkey products.
- **The one transferable lesson.** When free production reaches your customers, the move is to
  **stop selling finished apps and start selling malleable tools** — meet the demand that the
  ICP would otherwise satisfy themselves.

### Two deep allocation writers (read, not fork)

Neither ships repos, but both are the sharpest *long-form* on bottleneck A:

- **Jason Cohen — *A Smart Bear*** (two bootstrapped unicorns). His essay
  [*What Makes a Strategy Great*](https://longform.asmartbear.com/great-strategy/) is the best
  short treatment of **durable differentiation**: magnify a *differentiated, durable* strength
  rather than fixing weaknesses — which is exactly the test for "won't be easily built by my
  ICP." ([asmartbear.com](https://longform.asmartbear.com/))
- **Paul Graham** — the operator-manual essays on *what to build*:
  [*Schlep Blindness*](https://www.paulgraham.com/schlep.html) (great ideas hide behind
  tedious work nobody wants to see — a durable allocation edge *because* it repels others) and
  [*Do Things That Don't Scale*](https://www.paulgraham.com/ds.html) (manual, unscalable early
  effort as deliberate strategy — the propagation analogue of doing-things-by-hand first).

---

## 3. Two playbooks, extracted

### A. Allocation checklist (what to build)

Run a candidate through these before spending even cheap production on it:

1. **Valuable?** Is there one user who *really* needs this and can act on the need? (PG's
   toehold test.) If you can't name them, stop.
2. **Already exists?** If a good-enough version exists, only proceed if you have a
   *differentiated, durable* angle (Cohen's strategy test) — not a marginal one.
3. **Easily built by the ICP?** *The new key filter.* If the thing is fully spec-able, assume
   your customer can soon build it themselves. Push toward the un-spec-able: **taste,
   proprietary data/access, or hard-to-spec judgment work.** (This is where Litt's
   "malleable, personal" answer and MOTIF's "upstream of the transaction" answer both live.)
4. **Cheap shot, ruthless kill.** Make the bet small (Willison's plugin-sized units,
   Karpathy's minimal constraint, Levels's 24–72h ship) and pre-commit to kill criteria.
5. **Schlep on purpose.** Prefer ideas guarded by tedious work — the schlep *is* the moat
   (PG).

### B. Propagation loop (how it reaches people)

The shared pattern across Willison, Karpathy, and Huntley:

> **Ship → write it up → make it forkable/indexable → let it compound.**

- **Write up every shipped thing** (Willison). The writeup, not the artifact, is what
  travels.
- **Make the artifact legible and forkable** (Karpathy). Legibility *is* distribution.
- **Name the thing** (Huntley's "Ralph," swyx's "AI Engineer"). A memorable, ownable name
  carries the idea further than the idea alone.
- **Automate the publishing step** (Willison's `til`). If shipping doesn't *automatically*
  produce a public, indexed artifact, propagation will silently lose to production.
- **Build the audience before you need it** (Levels, swyx). Owned audience converts every
  future bet into free reach.

---

## 4. Appendix — repos to fork

| Repo | What it gives you | Best for |
|---|---|---|
| **[simonw/til](https://github.com/simonw/til)** | Markdown notes → GitHub Action → self-updating index + searchable [Datasette](https://github.com/simonw/datasette) site. Shipping = publishing. | **The propagation engine** — turn frequent notes into a compounding public feed. *Most directly relevant to MOTIF's "Intelligence Feed."* |
| **[simonw/datasette](https://github.com/simonw/datasette)** | Explore + publish data as a searchable site; plugin ecosystem. | Publishing structured intelligence/data with little ops. |
| **[simonw/llm](https://github.com/simonw/llm)** | CLI + Python library for LLMs; plugin architecture; small composable bets. | Building LLM tooling as separable, low-cost units. |
| **[karpathy/nanochat](https://github.com/karpathy/nanochat)** | Minimal full-stack ChatGPT clone (~8k legible lines). | Learning/teaching the LLM stack; a legible base to fork. |
| **[karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)** / **[llm.c](https://github.com/karpathy/llm.c)** | Minimal training implementations. | Same — minimal-legible reference style. |
| **Ralph pattern** ([ghuntley.com/ralph](https://ghuntley.com/ralph/)) | A Bash loop + prompt file that industrializes agentic production. | Automating production itself; the writeup *is* the spec. |
| **[Ink & Switch / Litt prototypes](https://www.geoffreylitt.com/)** | Malleable / personal-software prototypes. | Reference for "tools the user reshapes," not turnkey. |

**No repo (read for judgment):** Pieter Levels (closed source), swyx ("Learn in Public"
doctrine), Jason Cohen (*A Smart Bear* strategy essays), Paul Graham (essays).

---

## 4b. Starter repo, in depth — the one to fork

If you want a single concrete thing to work off of, it's the **`til` pattern**. Here's the
recommendation made actionable (still reference-only — no changes to the live site).

**Recommended:** **[`simonw/til`](https://github.com/simonw/til)** — fork it directly, or
rebuild its ~50-line GitHub Action into a fresh repo.

**Why this one over the alternatives:**

| Option | What it is | Verdict for MOTIF |
|---|---|---|
| **`simonw/til`** ✅ | Markdown → GitHub Action → self-updating index + searchable Datasette site | **Pick this.** Lowest lift, "shipping = publishing," and the Datasette layer gives a *searchable, queryable* feed — which matches "intelligence feed," not "blog." |
| [Quartz](https://github.com/jackyzha0/quartz) | Obsidian/markdown → static digital-garden site | Prettier out of the box, but garden/wiki-shaped, no query layer. Good if you want backlinks over search. |
| Astro content collections | Typed markdown/MDX → static site | Most control, but it's a *framework adoption*, not a fork — more build than you asked for. |

**How `simonw/til` actually works (the mechanism you're forking):**

1. You write a markdown file in a topic folder (e.g. `critical-minerals/zambia-cobalt.md`).
2. On push, a [GitHub Action](https://simonwillison.net/2020/Apr/20/self-rewriting-readme/)
   parses every markdown file, builds a SQLite DB (`til.db`), and **rewrites the README
   index** so it always lists every entry (it skips its own README commits to avoid loops).
3. The same Action publishes `til.db` to a [Datasette](https://github.com/simonw/datasette)
   instance (Vercel/Fly), giving you a **full-text-searchable** site over your notes — with a
   custom `index.html` template for the public landing page.

**Net effect:** the act of committing a note *is* the act of publishing a searchable,
indexed, public artifact. That's the propagation loop from §3B, automated.

**A 5-step evaluation path (before committing to it):**

1. Fork `simonw/til`; read the workflow in `.github/workflows/`.
2. Replace his topic folders with MOTIF's (energy / minerals / compute / capital /
   sovereignty); drop in 2–3 real notes.
3. Confirm the Action regenerates the README index on push.
4. Stand up the Datasette site on Vercel/Fly; confirm search works over your notes.
5. Decide: does a *queryable feed* read as "intelligence," or do you want the editorial
   polish of the current static pages? (This is the real fork in the road — see §5.)

**Honest caveats:** Datasette's default UI is utilitarian, not editorial — it'll look like a
data tool, not like the current MOTIF site, unless you template it. And it adds a hosting
dependency (Vercel/Fly + the Action) to a repo that today has *zero* build step. Those are the
tradeoffs against the static-HTML simplicity you have now.

## 5. Bottom line for MOTIF 54

- **Best single fit to the framing:** **Simon Willison** — he runs both bottlenecks as one
  disciplined public system, and `simonw/til` is the concrete "repo we can work off of."
- **The repo that maps to our actual gap:** the **`til`-style markdown → auto-published,
  searchable feed**. The site today is hand-authored static HTML with no content system; this
  pattern is the lowest-lift way to make *shipping intelligence = distributing it*, and it
  slots directly under the "Intelligence Feed" we already advertise. (Out of scope this round
  — kept as a ready fast-follow.)

---

## Sources

- Simon Willison — [entries feed](https://simonwillison.net/entries/),
  [llm](https://github.com/simonw/llm), [datasette](https://github.com/simonw/datasette),
  [til](https://til.simonwillison.net/),
  [self-rewriting README via Actions](https://simonwillison.net/2020/Apr/20/self-rewriting-readme/),
  [on malleable software](https://simonwillison.net/2025/Jun/11/malleable-software/)
- Andrej Karpathy — [nanochat](https://github.com/karpathy/nanochat),
  [autoresearch](https://github.com/karpathy/autoresearch),
  [nanochat journey thread](https://x.com/karpathy/status/1977755427569111362)
- Geoffrey Huntley — [Ralph](https://ghuntley.com/ralph/),
  [everything is a ralph loop](https://ghuntley.com/loop/)
- Pieter Levels — [strategy breakdown](https://www.systemscowboy.com/pieter-levels-indie-hacker-strategy/)
- swyx — [swyx.io](https://www.swyx.io/), [How to Thought Lead (2026)](https://www.swyx.io/lead)
- Geoffrey Litt — [malleable software essay](https://www.inkandswitch.com/essay/malleable-software/),
  [geoffreylitt.com](https://www.geoffreylitt.com/)
- Jason Cohen — [A Smart Bear](https://longform.asmartbear.com/),
  [What Makes a Strategy Great](https://longform.asmartbear.com/great-strategy/)
- Paul Graham — [Schlep Blindness](https://www.paulgraham.com/schlep.html),
  [Do Things That Don't Scale](https://www.paulgraham.com/ds.html)

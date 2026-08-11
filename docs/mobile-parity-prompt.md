# Prompt — Mobile Parity Wave (paste into a fresh Claude Code session)

> Usage: open a new Claude Code session at the repo root and paste everything
> below the line — or just write: `esegui @docs/mobile-parity-prompt.md`.

---

## ROLE

You are the senior motion + front-end engineer who owns the Domus Tua site
(`domus-tua-site`, Next 16 App Router). You are closing the single largest
quality gap left in the product: **on a phone this site is a documentably
poorer experience than on a desktop** — the intro never plays, the signature
scroll set pieces never fire, and the choreography degrades to plain fades.

Your mission is **mobile parity of intent, not parity of implementation.**
Every signature moment must land on a 390px touch screen — expressed in the
gesture language that screen actually has, at a cost that phone can actually pay.

Ultracode is on: use the `Workflow` tool (parallel agents + a final adversarial
verification pass over the diff). Do not ship on a single unverified pass.

---

## 1. READ FIRST (non-negotiable, before writing a single line)

1. `AGENTS.md` — **this is not the Next.js in your training data.** Next 16.2.9
   has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/`
   before touching anything Next-specific. Heed deprecation notices.
2. `app/lib/motion/gsap.ts` — the **motion signature**: the only legal
   vocabulary. Durations (`dur`), staggers (`stagger`), distances (`dist`),
   the `domus` / `domus.inOut` / `dtDiveIn` / `dtOut` / `dtHorScroll` / `dtLoader`
   CustomEases, and `MQ`. You will be extending `MQ`, not bypassing it.
3. `docs/effetti-reference.md` — which effect lives in which section, and why.
   One effect per section. No effect appears twice.
4. `docs/wow-layer-plan.md` — the fixed-element inventory and the stacking rules.
5. `docs/performance.md` + `lighthouserc.js` — the budget you are spending against.
6. `docs/e2e.md` + `playwright.site.config.ts` — the five viewports and the
   `@layout` tag convention.
7. Project memory: `domus-motion-architecture`, `domus-wow-layer`,
   `domus-fioritura-teamtrail`, `domus-testing-windows`,
   `domus-direttive-cliente-scroll`, `domus-cta-system`.

Do not summarize these back to me. Read them and let them constrain the work.

---

## 2. GROUND TRUTH — what a phone loses today

This inventory is **verified against the code**, not assumed. Confirm each line
before acting on it; if a line is stale, say so and correct it.

### 2.1 The intro never happens

`app/layout.tsx:23` — `preloaderBootScript` sets `<html data-preloader>` only when
`matchMedia("(min-width: 768px)")` matches. Below 768px the attribute is never
set, so `Preloader.tsx` (517 lines of arch-door choreography, brand lockup,
progress, dive-in handoff to `HeroCinematic` via `INTRO_EVENT`) **never runs and
never even mounts its timeline**. The cost described in that comment is real —
but the conclusion drawn from it is exactly what this wave overturns. "Mobile
semplificato" was a deliberate choice, and it is now a deliberate *un*-choice:
see §5. **This is the headline item of the wave, not a nice-to-have.**

### 2.2 The signature scroll moments are desktop-gated at 1024px

| Component | Gate | What the phone gets instead |
|---|---|---|
| `motion/ThreadNav.tsx:23` (`RAIL_MQ`) | ≥1024 | no red thread at all |
| `motion/HorizonScroller.tsx:34` (`HORIZON_MQ`) | ≥1024 | the "orizzonte" set piece collapses to a plain vertical stack |
| `motion/HorizontalRail.tsx:72` | ≥1024 | static row; note the **already-declared but unused `snapMobile` prop + `data-snap` attribute** at `:46/:57/:156` |
| `components/TeamTrail.tsx:125` | ≥1024 | no full-page trail |
| `components/Paths.tsx:218` | ≥1024 | no choreography on the two-paths chapter |
| `components/StarReviews.tsx:231` | ≥1024 | no star moment (and it lives *inside* `HorizonStory`, so mobile loses both layers at once) |
| `components/ReviewsWall.tsx:88` (`WALL_MQ`) | ≥1024 | static wall |
| `motion/HoverDistort.tsx:90` | fine pointer + ≥1024 | nothing (correct to stay off — but see §4, there is no touch equivalent) |
| `motion/CameraIn.tsx:28`, `HeroCinematic.tsx:154`, `PageHero.tsx:76`, `domande-frequenti/FaqContent.tsx:183` | ≥768 (`MQ.desktop`) | no camera move, no hero recomposition |

### 2.3 What is already correct on mobile — **do not "fix" these**

- `motion/SmoothScroll.tsx:6` — Lenis runs `smoothWheel: true` with **native
  touch**. This is deliberate: no scroll hijacking on a phone. **Never enable
  `syncTouch`.** Momentum scroll on iOS must stay native.
- `globals.css:199` — inputs forced to 16px below 768px (kills iOS focus zoom).
- `globals.css` `@media (pointer: coarse)` — `.tap-target` 44px hit areas via
  `::before`, `.tap-list` row-gap raised to match. The visual box is untouched.
- `MobileActionBar.tsx` — thumb-zone CTA + WhatsApp, hides at `#contatti`,
  footer reserves `pb-28` and `env(safe-area-inset-bottom)` behind `:has()`.
- `Footer.tsx:66/68` — **this is the pattern to copy**: a real `<1024` branch
  (`columnsEnter`) alongside the `≥1024` uncover, not a gate.
- `motion/LiquidReveal.tsx:49/66` — same: two branches, one per width class.
- `motion/ManifestoPin.tsx:112` — pin above 1024, scrub cascade below. Correct.
- `components/Reveal.tsx` — IntersectionObserver + CSS, works at every width.
- `motion/Cursor.tsx` and `motion/Magnetic.tsx` — fine-pointer only. **Leave
  them off.** A custom cursor on a touchscreen is a bug, not parity.

---

## 3. DOCTRINE

**Mobile is not a small desktop.** Six laws, in priority order:

1. **Translate the gesture, don't shrink the layout.** A pinned horizontal rail
   driven by 1400px of scroll is not "the same thing, narrower". Ask what that
   moment *means* (a lateral journey; a reveal; a thread stitching chapters) and
   find the touch-native expression of that meaning: a snap carousel with a
   progress rail, a scrubbed vertical sequence, a sticky caption over a media
   run. Same intent, different mechanics.
2. **The thumb is the viewport.** Anything interactive lives in the bottom third.
   Anything destructive lives away from it. Fitts' law with a 10mm finger:
   ≥44px targets, ≥8px separation, no hover-dependent affordance anywhere.
3. **One signature moment per viewport-height.** Two competing animations on one
   phone screen read as noise. This is the Chanel rule already in force on
   desktop: **for every effect you add on mobile, name what you remove or
   simplify.** State it in the commit body.
4. **Never steal the scroll.** No `syncTouch`, no scroll-jacked pinning longer
   than ~1.2 viewport-heights, no gesture that traps the user mid-page. Every
   pinned or horizontal section must be escapable by continuing to scroll down.
5. **Assume a bad network, a warm battery, and a mid-range Android.** Budget for
   a 4× CPU throttle, not for your laptop. GPU-composited properties only
   (`transform`, `opacity`, `clip-path`); never animate `width`, `height`,
   `top`, `left`, or `filter: blur()` per-frame on mobile.
6. **Degradation must be designed, never accidental.** `prefers-reduced-motion`
   and no-JS must still yield a composed, complete page. Hidden states are set
   by JS only — never in SSR markup or base CSS (existing house rule).

---

## 4. THE TRIAGE — one verdict per gated effect

Work the §2.2 table one row at a time. For each, think it through explicitly
(what is the moment *for*? what does a finger do here? what does it cost?) and
then commit to exactly one of four verdicts. Write the verdict and its one-line
rationale into `docs/mobile-parity.md` as you go.

- **PORT** — the desktop mechanic works as-is on touch; only thresholds/geometry change.
- **TRANSLATE** — the intent survives, the mechanic is rebuilt for touch.
- **REPLACE** — the intent needs a different moment entirely on mobile.
- **KEEP OFF** — the moment is genuinely pointer-only; the phone loses nothing.
  Requires a stated reason. This verdict is allowed, but it is not the default.

### Worked examples (follow this reasoning shape)

**`HoverDistort` (OGL, fine pointer + ≥1024) → KEEP OFF.**
The effect *is* the pointer: distortion tracks cursor velocity over an image.
There is no finger equivalent that isn't a gimmick, and an OGL context on a
mid-range Android costs memory for a moment nobody triggers. Phone loses nothing
because the underlying image reveal (`MaskReveal`) still plays. No work.

**`ThreadNav` (red thread rail, ≥1024) → TRANSLATE.**
Intent: "the chapters of the home are stitched by one continuous thread." On
desktop it's a fixed left rail with chapter dots. A 390px screen has no lateral
room for a rail — but it has a top edge nobody is using. Rebuild as a 2px
progress hairline pinned under the header, in the same red, advancing on the
same ScrollTrigger data, with chapter ticks. Same thread, same meaning, zero
horizontal cost. Reduced-motion: static hairline at 0. Cost: one ScrollTrigger,
transform-only.

**`HorizontalRail` (≥1024) → PORT, with the prop that already exists.**
`snapMobile` and `data-snap` are declared and dead (`:46/:57/:156`). On touch,
native `scroll-snap-type: x mandatory` on the existing track is the correct
mechanic — it's the gesture a finger already expects, it costs no JS, and it
cannot steal the scroll. Wire the dead prop up, add a dot/progress indicator,
and keep the GSAP pin strictly ≥1024.

**`Preloader` (≥768) → TRANSLATE, under a hard performance gate.** See §5.

Now produce the remaining verdicts yourself.

---

## 5. THE INTRO — it ships on phones. Your job is to make it cheap.

**Decision already taken by the client, not open for re-litigation:** the Arco
Domus intro is the signature moment of the brand and the majority of visitors
arrive on a phone. A site whose best moment is reserved for desktop is backwards.
**The mobile intro is a deliverable of this wave.** The engineering question is
not *whether*, it is *at what cost* — and the answer must be "almost none".

What you must not do is lower the 768px threshold in `preloaderBootScript` and
call it done. The comment at `app/layout.tsx:19-22` describes a real constraint:
`largest-contentful-paint ≤ 2500ms` is an **error-level** assertion in
`lighthouserc.js` on `formFactor: "mobile"`. Design around it.

### 5.1 What actually costs money (and what doesn't)

Reason about the mechanism before optimizing. An opaque full-screen overlay of a
**solid colour** is not a contentful element and does not become the LCP
candidate; an element it merely *occludes* is still reported as painted. So the
overlay itself is not automatically the problem. The real costs are:

- **Bandwidth contention** — the `Preloader` chunk and `warmAllImages()` fetching
  while the hero image is still in flight.
- **Main-thread time** — hydration + GSAP timeline construction + the per-letter
  `PreChars` split, landing straight on TBT (budget: ≤300ms).
- **Any layer that turns the overlay contentful** — a background *image*, or type
  large enough to outrank the hero. Keep the lockup modest and vector/text.

Verify these against a real trace rather than trusting the list.

### 5.2 The mobile cut — same gesture, fewer acts

Keep what makes it *the* moment: **the arch door rising and the dive-in**. That
is the brand mark drawing itself; everything else is preamble.

- **Target ≤1.8s** to full reveal (desktop is ~5s). The arch keeps its `dtDiveIn`
  ease and its shape — you are cutting duration and acts, never the gesture.
- **First frame in CSS, zero JS.** The overlay is already mounted by the inline
  script before hydration and `globals.css` already carries the 4-layer mask.
  Make act 1 (lockup visible, arch at rest) a pure CSS state so the intro looks
  alive even if the chunk hasn't landed — GSAP takes the wheel only for the dive.
- **Drop `PreChars` on mobile.** One span per letter is layout cost for text
  that's illegible at this speed anyway. Animate whole lines behind the existing
  overflow mask (the `TextLines` idiom).
- **Cut the progress counter act** unless it earns its keep visually at 390px.
- **Keep `MarkBadge` / `spinMarkBadge`** — transform-only SVG, it's the brand,
  it's nearly free.
- **Warmup discipline:** `warmAllImages()` during a mobile intro competes with
  the hero for bandwidth. On mobile warm the hero and first fold only, and push
  the rest through `scheduleIdleWarmup()` *after* `INTRO_EVENT`.
- **Keep the arch fallback** for missing `mask-composite` (the clip-path curtain).

### 5.3 Contracts that must not break

- `INTRO_EVENT` handoff to `HeroCinematic` holds identically.
- The Lenis contract in `SmoothScroll.tsx:38-46`: `lenis.stop()` while
  `data-preloader` is present, `lagSmoothing(0)` and `start()` restored in
  `finish()`. **A phone that exits the intro with Lenis still stopped is a dead
  page.** Cover it with an e2e test, not with a read-through.
- One per session (`INTRO_KEY` / `dt-intro-seen`), skippable — on mobile that
  means **first touch**, not just click/keypress.
- Keep `window.__dtPreFailsafe`; shorten it to match the shorter intro. Never
  remove it.

### 5.4 Measure it honestly

`npm run lighthouse` runs with empty `sessionStorage`, so the lab always walks
the intro path — the score you see is the once-per-session worst case, not the
steady state. Report **both**:

1. cold (intro plays) — this is what the assertions gate on;
2. warm (`dt-intro-seen` pre-set) — isolates the intro's true cost from the
   page's own baseline.

If cold breaches the budget, walk this ladder **in order** and stop at the first
rung that passes. Report which rung you landed on:

1. duration down to ~1.2s;
2. drop the progress act;
3. drop the payoff line — lockup + arch only;
4. act 1 fully CSS, chunk only takes over for the dive;
5. defer the chunk until after the hero image's `decode()` resolves;
6. silently skip the intro on `saveData` / `effectiveType: 2g|slow-2g` /
   `deviceMemory ≤ 4` — a cheap phone on a bad line gets the fast page, which is
   the right trade and is invisible to everyone else.

Rung 6 is a *device* condition, not a width condition. **"No intro below 768px"
is off the table** — that's the state we're fixing. If after rung 6 the budget
still fails, stop and bring me the numbers with your read on whether the
constraint or the effect should give; do not quietly ship a regression, and do
not quietly relax the assertion in `lighthouserc.js` to make the run green.

---

## 6. BUDGET AND GUARDRAILS

Enforced by `lighthouserc.js` (mobile form factor, simulated throttling):

| Assertion | Threshold | Level |
|---|---|---|
| `categories:performance` | ≥ 0.90 | error |
| `categories:accessibility` | ≥ 0.95 | error |
| `categories:seo` | ≥ 0.95 | error |
| `cumulative-layout-shift` | ≤ 0.1 | error |
| `largest-contentful-paint` | ≤ 2500ms | error |
| `total-blocking-time` | ≤ 300ms | error |

Additional rules:

- **No new dependencies.** GSAP + ScrollTrigger + Lenis is the stack. No
  three.js, no WebGPU, no canvas/WebGL beyond the existing `ogl` usage in
  `HoverDistort` — and `ogl` gets no new call sites.
- **Client directive, absolute:** nothing glass / liquid / plasma / water /
  frost / ripple. Not even renamed.
- **Client directive:** no perceived cuts between sections, large type, large
  images, real logo, SVG flowers. Reference: era-residence.com.
- Every ScrollTrigger you add must be created inside `gsap.matchMedia()` and
  must be revertible; check `ScrollTrigger.refresh()` on the dynamic-height
  sections (known trap, see `domus-wow-layer` memory).
- Never put a transform on an ancestor of a `fixed`/`sticky` element — it
  creates a containing block and silently breaks `Header`, the menu overlay,
  `WhatsAppFloat` and `MobileActionBar`.
- Mobile browser chrome resizes the viewport: use `dvh`/`svh` (the codebase
  already does), never `100vh`, for anything full-height.
- Respect `env(safe-area-inset-*)` on anything fixed to an edge.

---

## 7. PLAN OF WORK

Phase 0 — **Audit.** Verify §2 against the code. Produce `docs/mobile-parity.md`:
the inventory, one verdict per row with rationale, the removal named for each
addition (Chanel rule), and the intro decision with its measurement plan. Also
capture a *baseline*: `npm run lighthouse` and screenshots at 390px of every
route, before touching anything. **Show me this document and stop for approval
before Phase 1.**

Phase 1 — **Foundation.** Extend `MQ` in `app/lib/motion/gsap.ts` with the
missing named conditions (a `touch` / `coarse` condition and an explicit
`belowDesktop`), so mobile branches read as first-class citizens rather than
negations. Convert the §2.2 gates from *exclusions* to *branches* — every
`mm.add(desktop, …)` gains its sibling `mm.add(mobile, …)`, even where that
sibling is a deliberate no-op with a comment saying why.

Phase 2 — **The set pieces.** Implement the TRANSLATE/PORT/REPLACE verdicts,
highest-impact first: the home's `HorizonStory`/`StarReviews` chapter, then
`ThreadNav`, `Paths`, `TeamTrail`, `HorizontalRail`, `ReviewsWall`, then the
`CameraIn`/`PageHero`/`FaqContent` 768px gates.

Phase 3 — **The intro** (§5). It ships; the work is making it cheap enough to,
measured cold *and* warm, with the concession ladder walked in order if needed.

Phase 4 — **Touch & ergonomics sweep.** Every route at 360/390/768: tap targets,
thumb reach, safe areas, no horizontal overflow at 360px, focus visibility,
`Header` overlay scroll-lock, form field zoom, `MobileActionBar` collisions with
`WhatsAppFloat` and the cookie banner.

Phase 5 — **Verification** (§8) and a final adversarial review pass over the
full diff.

Commit per phase. Italian commit messages, house style (lowercase conventional
prefix, then a phrase that says what changed in human terms).

---

## 8. VERIFICATION — evidence, not adjectives

You are on Windows. Per project memory: **verify motion only with headless
Playwright**, and note that the visual-snapshot suite is darwin-only, so do not
chase snapshot diffs here.

Required, and reported with actual output:

1. `npm run check` (lint + typecheck + unit + build) — green.
2. `npm run test:e2e` — `playwright.site.config.ts`, port 3177, production build.
   Projects: `mobile-390` (iPhone 13, **full suite**), `mobile-360`,
   `tablet-768`, `desktop-1366`, `desktop-1440`. **Tag every new width-dependent
   test `@layout`** — the three intermediate viewports only run those.
3. New e2e coverage, at minimum:
   - the mobile intro at 390px: plays on a cold session, is skippable on first
     touch, releases Lenis (`getLenis()` scrolls again), `data-preloader` is gone
     afterwards, and it does **not** replay on the second navigation;
   - each translated set piece actually animates at 390px (assert a transform
     or a ScrollTrigger progress change, not merely that the node exists);
   - no horizontal document overflow at 360px on every route;
   - `prefers-reduced-motion: reduce` at 390px yields a complete, composed page.
4. `npm run lighthouse` — post the mobile numbers next to the Phase 0 baseline.
5. Screenshots at 390px of every route, before/after.

A phase is not done because the code looks right. It is done when the output
above says it is.

---

## 9. SKILLS — invoke before writing code

Mandatory:

- `impeccable` (run its `context.mjs`; load craft-floor before editing UI)
- `mobile-design` (touch psychology, thumb zones, Fitts' law, perf doctrine)
- `frontend-dev-guidelines`, `web-design-guidelines`, `baseline-ui`
- `gsap-scrolltrigger`, `gsap-timeline`, `gsap-plugins` (official GreenSock)
- `scroll-experience`, `awwwards-animations`
- `fixing-motion-performance`, `web-performance-optimization`, `lighthouse`
- `ui-a11y` / `wcag-audit-patterns` for the Phase 4 sweep
- `nextjs-best-practices` — but `AGENTS.md` wins on any conflict

Use Context7 MCP for current Next 16 / Tailwind v4 / GSAP / Lenis API surface
rather than recalling it. If a skill doesn't actually cover the task, say so
plainly instead of pretending it guided you.

Note: `npx find-skills` returns 404 in this environment — discover skills from
the session list, not from that CLI.

---

## 10. ANTI-PATTERNS — automatic rejection

- Lowering a breakpoint and calling it parity.
- `syncTouch` on Lenis, or any scroll-jacking on touch.
- Copying a pinned desktop timeline onto mobile because it "technically runs".
- Hover-dependent affordances with no touch equivalent.
- Hidden states rendered in SSR markup or base CSS instead of set by JS.
- `100vh` on a phone.
- Animating layout properties, or `filter: blur()` per frame, on mobile.
- Adding effects without naming what comes out (Chanel rule).
- Reporting "done" without the §8 evidence.
- Any dependency added to `package.json`.

---

## 11. DEFINITION OF DONE

1. `docs/mobile-parity.md` exists: every gated effect has a verdict, a rationale,
   and — where an effect was added — the thing that was removed to make room.
2. No `mm.add(desktop, …)` in the codebase without either a sibling mobile
   branch or an inline comment stating why mobile is deliberately silent.
3. **The Arco Domus intro plays on a 390px phone**, once per session, skippable
   on first touch, releasing Lenis correctly — with the rung of the §5.4 ladder
   it landed on stated explicitly.
4. A visitor on a 390px phone experiences the home's signature chapters as
   *choreographed*, not as a list of fading blocks — and can say what the
   experience was about afterwards.
5. Every Lighthouse assertion in §6 still passes on mobile, cold and warm.
   Numbers posted next to the Phase 0 baseline.
5. `npm run check` and `npm run test:e2e` green, with the new `@layout` and
   mobile-motion specs included.
6. Reduced-motion and no-JS still yield a complete, composed page at 390px.

Start with Phase 0. Show me the audit document and wait for my approval before
you implement anything.

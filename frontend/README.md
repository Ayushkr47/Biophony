# Biophony — Acoustic Habitat Health Monitor (frontend)

Next.js 16 + TypeScript + Tailwind v4 frontend for the acoustic habitat-health
monitor. Runs entirely on seeded demo data today; the FastAPI backend swaps in
at the boundaries listed below.

```bash
npm run dev
```

Then open http://localhost:3000.

## Routes

| Route | What it is |
|---|---|
| `/` | Landing page — hero, pipeline (pinned scroll), three-layer argument, site map, limitations |
| `/sites` | All monitored sites with headline metrics |
| `/sites/[id]` | Per-site dashboard: trends, expected-vs-observed, flags, detection review, recording log |
| `/upload` | Upload form with async job-status flow |
| `/method` | How each number is computed, plus licensing |

## Where the backend plugs in

Everything the UI needs is defined in [`src/lib/data.ts`](src/lib/data.ts). That
file is a seeded generator, but the exported **types are the contract**:

- `Site`, `Recording`, `Detection`, `Species`, `Flag`
- `trendForSite(siteId)` → the series behind both charts
- `expectedVsObserved(siteId)` → the GBIF comparison table
- `aciSummary(siteId)` / `siteSummary(siteId)` → the stat tiles
- `flagsForSite(siteId)` → the flag list

Replace the bodies with fetches against FastAPI and the components need no
changes. The upload flow's `runJob()` in
[`src/components/upload/UploadFlow.tsx`](src/components/upload/UploadFlow.tsx)
is the one place that simulates polling — point it at `/jobs/{id}`.

The seeded data is deterministic (mulberry32 from a fixed seed) so server and
client render identically and the demo looks the same every run.

## The 3D background

A fixed, full-viewport WebGL field in
[`src/components/three/`](src/components/three/): a point-cloud "soundscape
terrain" whose height comes from layered simplex noise. The cursor injects a
travelling ripple; scroll advances the terrain, lifts its amplitude and dollies
the camera.

It is decorative and treated as such:

- `aria-hidden`, `pointer-events: none`, never in the tab order
- Dynamically imported after first paint — the page is readable before three.js
  arrives, and works fully without it
- Particle counts and DPR scale down via `getPerfTier()` (low/mid/high)
- Held behind a light veil so it never costs body copy its contrast
- Under `prefers-reduced-motion` the clock stops and one static frame renders

## Motion

All scroll animation is owned by
[`MotionProvider`](src/components/motion/MotionProvider.tsx). Elements opt in
declaratively:

```html
<div data-reveal="up|fade|scale|left|right|rise3d" data-reveal-delay="0.2">
<div data-reveal="up" data-stagger>      <!-- animates children -->
<div data-parallax="-12">                 <!-- decorative layers only -->
<section data-pin> <article data-pin-step="0"> …
```

Notes worth keeping in mind if you edit it:

- Reveals use `fromTo`, not `from`. The CSS pre-hide sets `opacity: 0`, and
  `gsap.from` would read that as the *destination* and animate 0 → 0.
- The pin engages at `lg` and above only; below that the steps are ordinary
  stacked content.
- The pinned section is wrapped in a plain `<div>` on purpose — ScrollTrigger
  moves the section into a generated `.pin-spacer`, and without the wrapper
  React throws `NotFoundError` removing it on navigation.
- A timer failsafe snaps in-viewport reveals to their final frame after 2.6s.
  `requestAnimationFrame` is suspended in background tabs, so without it a page
  opened in one would render blank until focused.

## Accessibility

Verified rather than assumed:

- Every colour token pair meets 4.5:1 (`--hb-primary-hi` is deliberately darker
  than it looks like it should be so white labels clear AA across the *whole*
  button gradient, not just its dark stop)
- No interactive target under 24×24 CSS px; no horizontal scroll at 375px
- Charts ship a real table view, a text summary for screen readers, dashed vs.
  solid series so they are separable without colour
- Failed form submits focus a linked error summary and keep inline field errors
- Focus rings are never removed; zoom is never disabled

## Known gaps

- Site map is a schematic CSS-3D plane, not a tile map. At four sites a real
  basemap adds weight without adding information — swap in MapLibre when sites
  get dense enough to need geography.
- Detection review state is local to the component; it needs a PATCH endpoint.

## Attribution

Species identification is by **BirdNET** (K. Lisa Yang Center for Conservation
Bioacoustics, Cornell Lab of Ornithology & Chemnitz University of Technology).
BirdNET models are released under **CC BY-NC-SA 4.0** — non-commercial, with
attribution and share-alike. Verify the current licence before any deployment
beyond research or demonstration. Expected-species baselines come from the GBIF
API; seed recordings are from Xeno-canto under contributor licences.

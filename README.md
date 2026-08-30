# Biophony — Acoustic Habitat Health Monitor

Biodiversity surveys happen once a year. A habitat can degrade for months before
anyone notices. Passive acoustic monitoring is the cheapest early-warning signal
available, but the tooling is researcher-grade and the data sits in silos.

Biophony takes a field recording — phone audio is fine — tagged with a location
and a timestamp, and treats it as **a sample of a site over time** rather than a
one-off species ID.

## What a site dashboard shows

- **Species richness and detection counts**, trended across every recording that
  site has
- **Expected vs. observed** — what GBIF occurrence records say should be at those
  coordinates, against what was actually heard
- **Flags** — an indicator species that has stopped appearing, a rising share of
  disturbance-associated species, falling acoustic complexity
- **Acoustic complexity index (ACI)** — a soundscape-ecology metric computed
  straight off the spectrogram

That last layer is the point. Species classifiers are imperfect, and noticeably
more so outside North America and Europe. The ACI makes no reference to species
identity, so the habitat signal survives even when the classifier is wrong.

## Status

| Part | State |
|---|---|
| `frontend/` | Built — Next.js 16, TypeScript, Tailwind v4, WebGL background, GSAP scroll |
| `backend/` | Not started — FastAPI, BirdNET, librosa, GBIF |

**The frontend currently runs on seeded demo data.** Four sites with twelve
weekly recordings each, generated deterministically in
[`frontend/src/lib/data.ts`](frontend/src/lib/data.ts). No model runs, no API is
called, and an uploaded file is not analysed or persisted — the upload flow
simulates the async job so the interaction can be demonstrated.

The exported types in that file are written as the API contract, so the backend
slots in behind them without changing components.

## Running the frontend

```bash
cd frontend && npm install && npm run dev
```

Then open http://localhost:3000. See
[`frontend/README.md`](frontend/README.md) for architecture, the motion system,
and the accessibility work.

## Planned stack

- **Frontend** — Next.js + TypeScript + Tailwind, Recharts for trends
- **Backend** — Python FastAPI
- **Identification** — [BirdNET-Analyzer](https://github.com/birdnet-team/BirdNET-Analyzer),
  TFLite on CPU, 3-second windows
- **Expected ranges** — [GBIF API](https://www.gbif.org/) (free, no key)
- **Acoustic index** — librosa
- **Storage** — SQLite or Supabase

## Known limitations

These are stated in the UI rather than hidden:

- BirdNET is trained predominantly on North American and European species.
  Accuracy on Indian species is patchier — detections are candidates for review,
  not conclusions. Every detection can be confirmed or rejected by hand, and
  rejected ones are excluded from richness and trend calculations.
- Uploads are capped at 60 seconds and processed asynchronously behind a job
  status endpoint, so a slow free-tier worker never blocks the request.
- GBIF occurrence density varies enormously by region and taxon. A species
  missing from the expected list may be under-recorded rather than absent, so the
  baseline is context, not ground truth.

## Attribution

Species identification uses **BirdNET**, developed by the K. Lisa Yang Center for
Conservation Bioacoustics at the Cornell Lab of Ornithology in partnership with
Chemnitz University of Technology. BirdNET models are released under
**CC BY-NC-SA 4.0** — non-commercial use, with attribution and share-alike.
Verify the current licence terms before any deployment beyond research or
demonstration.

Expected-species baselines come from the GBIF API. Seed recordings are sourced
from [Xeno-canto](https://xeno-canto.org/) under their respective contributor
licences.

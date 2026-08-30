/**
 * Seeded demo dataset.
 *
 * Generated from a fixed seed so the server and client render byte-identical
 * output (no hydration mismatch) and so the demo looks the same every run.
 * Replace with the FastAPI client when the backend lands — the shapes below
 * are the contract the UI expects.
 */

export type Guild = "indicator" | "generalist" | "disturbance";
export type SiteStatus = "healthy" | "watch" | "alert" | "recovering";

export type Species = {
  id: string;
  common: string;
  scientific: string;
  guild: Guild;
  /** Typical detectability, used to shape the synthetic series. */
  base: number;
};

export type Detection = {
  speciesId: string;
  /** Number of 3-second windows the species was detected in. */
  windows: number;
  /** Max BirdNET confidence across windows, 0..1. */
  confidence: number;
  /** Human-in-the-loop state. */
  review: "unreviewed" | "confirmed" | "rejected";
};

export type Recording = {
  id: string;
  siteId: string;
  /** ISO date. */
  date: string;
  durationSec: number;
  /** Acoustic Complexity Index — classifier-independent vitality proxy. */
  aci: number;
  richness: number;
  detections: Detection[];
  uploader: string;
};

export type Site = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  habitat: string;
  status: SiteStatus;
  /** Normalised 0..1 position for the schematic map. */
  mapX: number;
  mapY: number;
};

export type Flag = {
  id: string;
  siteId: string;
  kind: "silent-indicator" | "disturbance-rise" | "aci-decline" | "richness-drop";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  /** ISO date the flag was raised. */
  raised: string;
};

/* ---------------------------------------------------------------------- */
/* Deterministic PRNG (mulberry32)                                         */
/* ---------------------------------------------------------------------- */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------------- */
/* Species pool                                                            */
/* ---------------------------------------------------------------------- */

export const SPECIES: Species[] = [
  // Forest-interior indicators — the species that vanish first.
  { id: "mtbb", common: "Malabar Trogon", scientific: "Harpactes fasciatus", guild: "indicator", base: 0.42 },
  { id: "gyhb", common: "Great Hornbill", scientific: "Buceros bicornis", guild: "indicator", base: 0.3 },
  { id: "wcbb", common: "White-cheeked Barbet", scientific: "Psilopogon viridis", guild: "indicator", base: 0.62 },
  { id: "hclb", common: "Heart-spotted Woodpecker", scientific: "Hemicircus canente", guild: "indicator", base: 0.34 },
  { id: "orbl", common: "Orange-headed Thrush", scientific: "Geokichla citrina", guild: "indicator", base: 0.46 },
  { id: "nlfl", common: "Nilgiri Flycatcher", scientific: "Eumyias albicaudatus", guild: "indicator", base: 0.28 },

  // Generalists — present nearly everywhere, weak signal on their own.
  { id: "rvbu", common: "Red-vented Bulbul", scientific: "Pycnonotus cafer", guild: "generalist", base: 0.86 },
  { id: "orma", common: "Oriental Magpie-Robin", scientific: "Copsychus saularis", guild: "generalist", base: 0.78 },
  { id: "asko", common: "Asian Koel", scientific: "Eudynamys scolopaceus", guild: "generalist", base: 0.7 },
  { id: "prin", common: "Ashy Prinia", scientific: "Prinia socialis", guild: "generalist", base: 0.74 },
  { id: "pubu", common: "Purple Sunbird", scientific: "Cinnyris asiaticus", guild: "generalist", base: 0.68 },

  // Disturbance-associated — a rising share of these is the warning sign.
  { id: "hocr", common: "House Crow", scientific: "Corvus splendens", guild: "disturbance", base: 0.55 },
  { id: "romy", common: "Common Myna", scientific: "Acridotheres tristis", guild: "disturbance", base: 0.6 },
  { id: "rrpa", common: "Rose-ringed Parakeet", scientific: "Psittacula krameri", guild: "disturbance", base: 0.5 },
  { id: "bkit", common: "Black Kite", scientific: "Milvus migrans", guild: "disturbance", base: 0.44 },
  { id: "rodo", common: "Rock Dove", scientific: "Columba livia", guild: "disturbance", base: 0.4 },
];

export const speciesById = new Map(SPECIES.map((s) => [s.id, s]));

/* ---------------------------------------------------------------------- */
/* Sites                                                                   */
/* ---------------------------------------------------------------------- */

export const SITES: Site[] = [
  {
    id: "agumbe",
    name: "Agumbe Rainforest Plot",
    region: "Shivamogga, Karnataka",
    lat: 13.5025,
    lon: 75.0906,
    habitat: "Wet evergreen forest",
    status: "healthy",
    mapX: 0.22,
    mapY: 0.7,
  },
  {
    id: "valparai",
    name: "Valparai Shade-Coffee Corridor",
    region: "Coimbatore, Tamil Nadu",
    lat: 10.3271,
    lon: 76.9514,
    habitat: "Shade plantation mosaic",
    status: "recovering",
    mapX: 0.34,
    mapY: 0.88,
  },
  {
    id: "kanha",
    name: "Kanha Buffer Edge",
    region: "Mandla, Madhya Pradesh",
    lat: 22.3345,
    lon: 80.6115,
    habitat: "Sal forest / grassland edge",
    status: "watch",
    mapX: 0.55,
    mapY: 0.4,
  },
  {
    id: "yamuna",
    name: "Yamuna Floodplain Scrub",
    region: "Delhi NCR",
    lat: 28.6139,
    lon: 77.209,
    habitat: "Riparian scrub, peri-urban",
    status: "alert",
    mapX: 0.42,
    mapY: 0.16,
  },
];

export const siteById = new Map(SITES.map((s) => [s.id, s]));

/* ---------------------------------------------------------------------- */
/* Site trajectory profiles                                                */
/* ---------------------------------------------------------------------- */

type Profile = {
  seed: number;
  aciStart: number;
  aciEnd: number;
  /** Multiplier applied to indicator-guild presence at t=0 and t=1. */
  indicatorStart: number;
  indicatorEnd: number;
  disturbanceStart: number;
  disturbanceEnd: number;
  uploaders: string[];
};

const PROFILES: Record<string, Profile> = {
  /* Reference site: indicator guild well represented and steady, only a
     background level of disturbance-associated species. Should raise no flags. */
  agumbe: {
    seed: 1001,
    aciStart: 1642,
    aciEnd: 1698,
    indicatorStart: 1.62,
    indicatorEnd: 1.68,
    disturbanceStart: 0.62,
    disturbanceEnd: 0.6,
    uploaders: ["R. Kamath", "Forest Dept. — Agumbe", "A. Pillai"],
  },
  /* Recovering: indicators returning, disturbance species receding. */
  valparai: {
    seed: 2002,
    aciStart: 1381,
    aciEnd: 1524,
    indicatorStart: 0.86,
    indicatorEnd: 1.45,
    disturbanceStart: 1.12,
    disturbanceEnd: 0.74,
    uploaders: ["NCF Field Team", "S. Muthu", "Estate Watch"],
  },
  /* Watch: a clear indicator decline that has not yet hit complexity hard. */
  kanha: {
    seed: 3003,
    aciStart: 1588,
    aciEnd: 1462,
    indicatorStart: 1.55,
    indicatorEnd: 0.72,
    disturbanceStart: 0.7,
    disturbanceEnd: 1.15,
    uploaders: ["Buffer Patrol 3", "D. Verma", "Volunteer — Mocha"],
  },
  /* Alert: indicators nearly gone, disturbance dominant, complexity falling. */
  yamuna: {
    seed: 4004,
    aciStart: 1298,
    aciEnd: 1109,
    indicatorStart: 0.42,
    indicatorEnd: 0.1,
    disturbanceStart: 1.3,
    disturbanceEnd: 1.55,
    uploaders: ["Yamuna Citizen Watch", "P. Sharma", "K. Nair"],
  },
};

/* 12 weekly samples ending 2026-08-24. */
const WEEKS = 12;
const LAST_DATE = new Date("2026-08-24T00:00:00Z");

function isoWeeksBefore(weeksAgo: number) {
  const d = new Date(LAST_DATE);
  d.setUTCDate(d.getUTCDate() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildRecordings(): Recording[] {
  const out: Recording[] = [];

  for (const site of SITES) {
    const p = PROFILES[site.id];
    const rand = mulberry32(p.seed);

    for (let w = WEEKS - 1; w >= 0; w--) {
      const t = (WEEKS - 1 - w) / (WEEKS - 1); // 0 -> 1 across time
      const date = isoWeeksBefore(w);

      const indicatorMul = lerp(p.indicatorStart, p.indicatorEnd, t);
      const disturbanceMul = lerp(p.disturbanceStart, p.disturbanceEnd, t);

      const detections: Detection[] = [];

      for (const sp of SPECIES) {
        const mul =
          sp.guild === "indicator"
            ? indicatorMul
            : sp.guild === "disturbance"
              ? disturbanceMul
              : 0.9;

        // Presence roll, then intensity. Noise keeps weeks from looking canned.
        const presence = sp.base * mul * (0.72 + rand() * 0.56);
        if (presence < 0.36) continue;

        const windows = Math.max(1, Math.round(presence * 14 * (0.6 + rand() * 0.8)));
        const confidence = Math.min(
          0.97,
          Math.max(0.32, presence * 0.82 + rand() * 0.2),
        );

        // Older recordings have mostly been reviewed; recent ones have not.
        const review: Detection["review"] =
          w > 3
            ? confidence > 0.55
              ? "confirmed"
              : rand() > 0.7
                ? "rejected"
                : "confirmed"
            : "unreviewed";

        detections.push({
          speciesId: sp.id,
          windows,
          confidence: Math.round(confidence * 100) / 100,
          review,
        });
      }

      const accepted = detections.filter((d) => d.review !== "rejected");
      const aci =
        Math.round(lerp(p.aciStart, p.aciEnd, t) + (rand() - 0.5) * 46);

      out.push({
        id: `${site.id}-${date}`,
        siteId: site.id,
        date,
        durationSec: 45 + Math.round(rand() * 15),
        aci,
        richness: accepted.length,
        detections,
        uploader: p.uploaders[Math.floor(rand() * p.uploaders.length)],
      });
    }
  }

  return out;
}

export const RECORDINGS: Recording[] = buildRecordings();

export function recordingsForSite(siteId: string): Recording[] {
  return RECORDINGS.filter((r) => r.siteId === siteId).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/* ---------------------------------------------------------------------- */
/* Derived analytics                                                       */
/* ---------------------------------------------------------------------- */

export type TrendPoint = {
  date: string;
  label: string;
  richness: number;
  aci: number;
  indicator: number;
  disturbance: number;
  detections: number;
};

export function trendForSite(siteId: string): TrendPoint[] {
  return recordingsForSite(siteId).map((r) => {
    const accepted = r.detections.filter((d) => d.review !== "rejected");
    const guildCount = (g: Guild) =>
      accepted.filter((d) => speciesById.get(d.speciesId)?.guild === g).length;

    return {
      date: r.date,
      label: new Date(r.date + "T00:00:00Z").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      }),
      richness: r.richness,
      aci: r.aci,
      indicator: guildCount("indicator"),
      disturbance: guildCount("disturbance"),
      detections: accepted.reduce((sum, d) => sum + d.windows, 0),
    };
  });
}

/**
 * Expected-vs-observed. `expected` stands in for a GBIF occurrence query at
 * the site's lat/lon; `observed` is what the recordings actually contain.
 */
export type ExpectedRow = {
  species: Species;
  expected: boolean;
  /** Detections in the most recent 4 recordings. */
  recent: number;
  /** Detections in the 4 recordings before that. */
  prior: number;
  lastHeard: string | null;
};

export function expectedVsObserved(siteId: string): ExpectedRow[] {
  const recs = recordingsForSite(siteId);
  const recent = recs.slice(-4);
  const prior = recs.slice(-8, -4);
  const site = siteById.get(siteId);

  // Peri-urban scrub has a genuinely narrower expected forest-bird list.
  const periUrban = site?.id === "yamuna";

  const countIn = (list: Recording[], id: string) =>
    list.reduce((n, r) => {
      const d = r.detections.find(
        (x) => x.speciesId === id && x.review !== "rejected",
      );
      return n + (d ? 1 : 0);
    }, 0);

  return SPECIES.map((species) => {
    const expected =
      periUrban && species.guild === "indicator"
        ? species.base > 0.5
        : true;

    const lastRec = [...recs]
      .reverse()
      .find((r) =>
        r.detections.some(
          (d) => d.speciesId === species.id && d.review !== "rejected",
        ),
      );

    return {
      species,
      expected,
      recent: countIn(recent, species.id),
      prior: countIn(prior, species.id),
      lastHeard: lastRec?.date ?? null,
    };
  }).sort((a, b) => {
    const order: Record<Guild, number> = {
      indicator: 0,
      generalist: 2,
      disturbance: 1,
    };
    return (
      order[a.species.guild] - order[b.species.guild] ||
      b.recent - a.recent
    );
  });
}

/** Median ACI of the most recent 4 recordings, and the 4 before that. */
export function aciSummary(siteId: string) {
  const recs = recordingsForSite(siteId);
  const med = (xs: number[]) => {
    if (!xs.length) return 0;
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  };
  const recent = med(recs.slice(-4).map((r) => r.aci));
  const prior = med(recs.slice(-8, -4).map((r) => r.aci));
  const delta = prior ? ((recent - prior) / prior) * 100 : 0;
  return { recent, prior, delta: Math.round(delta * 10) / 10 };
}

export function siteSummary(siteId: string) {
  const recs = recordingsForSite(siteId);
  const latest = recs[recs.length - 1];
  const rows = expectedVsObserved(siteId);
  const aci = aciSummary(siteId);

  /* A "gap" is any expected species absent from the recent window. This must
     match the table's own filter exactly — two definitions of the same word
     on one dashboard is worse than either definition being imperfect. */
  const gaps = rows.filter((r) => r.expected && r.recent === 0);

  /* The stronger signal: present before, absent now. Drives the flag. */
  const wentSilent = gaps.filter((r) => r.prior > 0);
  const disturbanceShare =
    latest && latest.richness
      ? rows.filter((r) => r.species.guild === "disturbance" && r.recent > 0)
          .length / Math.max(1, rows.filter((r) => r.recent > 0).length)
      : 0;

  return {
    recordings: recs.length,
    latestDate: latest?.date ?? null,
    richness: latest?.richness ?? 0,
    totalDetections: recs.reduce(
      (n, r) =>
        n + r.detections.filter((d) => d.review !== "rejected").length,
      0,
    ),
    aci,
    missingCount: gaps.length,
    missing: gaps,
    silentCount: wentSilent.length,
    wentSilent,
    disturbanceShare: Math.round(disturbanceShare * 100),
  };
}

/* ---------------------------------------------------------------------- */
/* Flags                                                                   */
/* ---------------------------------------------------------------------- */

export function flagsForSite(siteId: string): Flag[] {
  const flags: Flag[] = [];
  const s = siteSummary(siteId);
  const rows = expectedVsObserved(siteId);
  const recs = recordingsForSite(siteId);
  const latestDate = s.latestDate ?? isoWeeksBefore(0);

  // 1. Indicator species that were present and have gone silent.
  for (const row of rows) {
    if (
      row.species.guild === "indicator" &&
      row.expected &&
      row.recent === 0 &&
      row.prior >= 2
    ) {
      flags.push({
        id: `${siteId}-silent-${row.species.id}`,
        siteId,
        kind: "silent-indicator",
        severity: row.prior >= 3 ? "high" : "medium",
        title: `${row.species.common} has gone quiet`,
        detail: `Detected in ${row.prior} of the previous 4 recordings, then absent from all 4 most recent. Last heard ${row.lastHeard ? formatDate(row.lastHeard) : "unknown"}.`,
        raised: latestDate,
      });
    }
  }

  // 2. Disturbance-associated species taking a larger share of the community.
  if (s.disturbanceShare >= 30) {
    flags.push({
      id: `${siteId}-disturbance`,
      siteId,
      kind: "disturbance-rise",
      severity: s.disturbanceShare >= 40 ? "high" : "medium",
      title: "Disturbance-associated species rising",
      detail: `${s.disturbanceShare}% of species detected in recent recordings are associated with degraded or human-modified habitat.`,
      raised: latestDate,
    });
  }

  // 3. Acoustic complexity falling — independent of classifier accuracy.
  if (s.aci.delta <= -4) {
    flags.push({
      id: `${siteId}-aci`,
      siteId,
      kind: "aci-decline",
      severity: s.aci.delta <= -8 ? "high" : "medium",
      title: "Acoustic complexity declining",
      detail: `Median ACI fell ${Math.abs(s.aci.delta)}% versus the previous four recordings (${s.aci.prior} to ${s.aci.recent}). This metric does not depend on species identification being correct.`,
      raised: latestDate,
    });
  }

  // 4. Richness trending down across the window.
  if (recs.length >= 8) {
    const early =
      recs.slice(0, 4).reduce((n, r) => n + r.richness, 0) / 4;
    const late =
      recs.slice(-4).reduce((n, r) => n + r.richness, 0) / 4;
    if (late < early - 1.5) {
      flags.push({
        id: `${siteId}-richness`,
        siteId,
        kind: "richness-drop",
        severity: late < early - 3 ? "high" : "low",
        title: "Species richness trending down",
        detail: `Mean richness fell from ${early.toFixed(1)} to ${late.toFixed(1)} species per recording across the sampled window.`,
        raised: latestDate,
      });
    }
  }

  const rank = { high: 0, medium: 1, low: 2 } as const;
  return flags.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export const ALL_FLAGS: Flag[] = SITES.flatMap((s) => flagsForSite(s.id));

/* ---------------------------------------------------------------------- */
/* Presentation helpers                                                    */
/* ---------------------------------------------------------------------- */

export const STATUS_META: Record<
  SiteStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  healthy: {
    label: "Stable",
    color: "var(--hb-ok)",
    bg: "rgba(11,110,90,0.10)",
    description: "Indicator species present, acoustic complexity holding.",
  },
  recovering: {
    label: "Recovering",
    color: "var(--hb-info)",
    bg: "rgba(14,116,144,0.10)",
    description: "Indicator detections and complexity both trending up.",
  },
  watch: {
    label: "Watch",
    color: "var(--hb-warn)",
    bg: "rgba(154,84,8,0.10)",
    description: "Early signs of decline in one or more measures.",
  },
  alert: {
    label: "Alert",
    color: "var(--hb-danger)",
    bg: "rgba(179,38,30,0.10)",
    description: "Multiple measures declining together.",
  },
};

export const GUILD_META: Record<
  Guild,
  { label: string; color: string; note: string }
> = {
  indicator: {
    label: "Indicator",
    color: "var(--hb-viz-1)",
    note: "Forest-interior specialists; first to disappear as habitat degrades.",
  },
  generalist: {
    label: "Generalist",
    color: "var(--hb-viz-5)",
    note: "Wide tolerance; weak signal on its own.",
  },
  disturbance: {
    label: "Disturbance-associated",
    color: "var(--hb-viz-2)",
    note: "Thrives in modified habitat; a rising share is a warning sign.",
  },
};

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

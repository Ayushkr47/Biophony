"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { SITES, STATUS_META, siteSummary } from "@/lib/data";
import { Eyebrow, StatusChip } from "@/components/ui/Primitives";
import TiltCard from "@/components/ui/TiltCard";

/**
 * Schematic site map.
 *
 * A tilted CSS-3D plane rather than a tile map: at four sites a real basemap
 * adds weight and a licence dependency without adding information. Swap in
 * MapLibre here once sites are dense enough to need geography.
 *
 * Every pin is a real link, so the map is fully keyboard-navigable — the
 * cards below carry the same information for anyone who skips the graphic.
 */
export default function SiteMapSection() {
  return (
    <section
      id="sites"
      className="relative mx-auto max-w-7xl px-5 sm:px-8 py-24"
      aria-label="Monitored sites"
    >
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:items-center">
        {/* ---------------- Copy + cards ---------------- */}
        <div>
          <div data-reveal="up">
            <Eyebrow>Monitored sites</Eyebrow>
            <h2 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.06] tracking-[-0.03em]">
              Four sites. Twelve weeks. One signal each.
            </h2>
            <p className="mt-5 text-[16.5px] leading-relaxed text-[var(--hb-ink-soft)] max-w-[52ch]">
              Seeded with real recordings so the trends are readable from the
              first visit. A dashboard with three months of samples reads as a
              system; one upload reads as a prototype.
            </p>
          </div>

          <ul data-reveal="up" data-stagger className="mt-8 space-y-3">
            {SITES.map((site) => {
              const s = siteSummary(site.id);
              return (
                <li key={site.id}>
                  <TiltCard max={5} lift={5} glare={false}>
                    <Link
                      href={`/sites/${site.id}`}
                      className="group block rounded-2xl hb-glass p-4 transition-shadow duration-200
                                 hover:shadow-[var(--hb-shadow-float)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[15.5px] leading-snug truncate">
                            {site.name}
                          </h3>
                          <p className="text-[12.5px] text-[var(--hb-ink-muted)] truncate">
                            {site.region} · {site.habitat}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusChip status={site.status} size="sm" />
                          <ArrowUpRight
                            className="size-4 text-[var(--hb-ink-muted)] transition-transform duration-200
                                       group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                                       group-hover:text-[var(--hb-primary)]"
                            strokeWidth={2.25}
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      <dl className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          { k: "Recordings", v: s.recordings },
                          { k: "Richness", v: s.richness },
                          { k: "ACI", v: s.aci.recent },
                        ].map((m) => (
                          <div
                            key={m.k}
                            className="rounded-lg bg-[var(--hb-card-sunk)] px-2.5 py-2"
                          >
                            <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--hb-ink-muted)]">
                              {m.k}
                            </dt>
                            <dd className="text-[16px] font-bold tabular leading-tight">
                              {m.v}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </Link>
                  </TiltCard>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ---------------- Tilted 3D plane ---------------- */}
        <div
          data-reveal="scale"
          className="relative"
          style={{ perspective: "1300px" }}
        >
          <div className="hb-map-plane relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] w-full">
            {/* Ground plane */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-3xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(155deg, #ffffff 0%, #e8f6ef 55%, #dcf0e7 100%)",
                boxShadow:
                  "0 40px 80px -30px rgba(11,43,36,0.3), inset 0 0 0 1px rgba(255,255,255,0.9)",
              }}
            >
              {/* Graticule */}
              <svg
                className="absolute inset-0 size-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {Array.from({ length: 11 }).map((_, i) => (
                  <line
                    key={`h${i}`}
                    x1="0"
                    y1={i * 10}
                    x2="100"
                    y2={i * 10}
                    stroke="rgba(11,110,90,0.09)"
                    strokeWidth="0.22"
                  />
                ))}
                {Array.from({ length: 11 }).map((_, i) => (
                  <line
                    key={`v${i}`}
                    x1={i * 10}
                    y1="0"
                    x2={i * 10}
                    y2="100"
                    stroke="rgba(11,110,90,0.09)"
                    strokeWidth="0.22"
                  />
                ))}
                {/* Suggestion of a river system, purely decorative */}
                <path
                  d="M 44 6 C 46 26, 38 38, 44 54 C 48 68, 40 82, 34 96"
                  fill="none"
                  stroke="rgba(14,116,144,0.22)"
                  strokeWidth="0.7"
                />
                <path
                  d="M 20 62 C 28 66, 34 74, 34 96"
                  fill="none"
                  stroke="rgba(14,116,144,0.16)"
                  strokeWidth="0.5"
                />
              </svg>
            </div>

            {/* Pins — raised off the plane in Z so they read as standing up */}
            {SITES.map((site) => {
              const meta = STATUS_META[site.status];
              const s = siteSummary(site.id);
              return (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  /* The link itself carries the 48px target rather than an
                     absolutely-positioned overlay, so the tap area is the
                     element's own box and measurable as such. */
                  className="group absolute grid place-items-center size-12"
                  style={{
                    left: `${site.mapX * 100}%`,
                    top: `${site.mapY * 100}%`,
                    // Counter-rotate so the pin faces the viewer, not the plane.
                    transform:
                      "translate(-50%, -50%) rotateZ(24deg) rotateX(-46deg) translateZ(34px)",
                    transformStyle: "preserve-3d",
                  }}
                  aria-label={`${site.name}, ${site.region}. Status ${meta.label}. ${s.recordings} recordings, richness ${s.richness}.`}
                >
                  <span className="relative grid place-items-center">
                    <span
                      aria-hidden="true"
                      className="absolute size-9 rounded-full hb-live-dot"
                      style={{ background: meta.color, opacity: 0.18 }}
                    />
                    <span
                      aria-hidden="true"
                      className="relative grid place-items-center size-7 rounded-full ring-[3px] ring-white
                                 transition-transform duration-200 group-hover:scale-115 group-focus-visible:scale-115"
                      style={{
                        background: meta.color,
                        boxShadow: "0 8px 18px -6px rgba(11,43,36,0.5)",
                        transitionTimingFunction: "var(--hb-ease-spring)",
                      }}
                    >
                      <MapPin className="size-3.5" strokeWidth={2.5} color="#fff" />
                    </span>
                  </span>

                  {/* Label card, always visible so the map is readable at rest */}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 whitespace-nowrap
                               rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold
                               bg-white/95 backdrop-blur shadow-[var(--hb-shadow-md)]
                               transition-transform duration-200
                               group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5"
                    style={{ color: "var(--hb-ink)" }}
                  >
                    {site.name.split(" ")[0]}
                    <span
                      className="ml-1.5 tabular font-bold"
                      style={{ color: meta.color }}
                    >
                      {s.richness}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

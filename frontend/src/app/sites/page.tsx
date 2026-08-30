import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin, Radio } from "lucide-react";

import { SITES, siteSummary, flagsForSite } from "@/lib/data";
import { Eyebrow, StatusChip } from "@/components/ui/Primitives";
import TiltCard from "@/components/ui/TiltCard";

export const metadata: Metadata = {
  title: "Sites — Biophony",
  description:
    "Every monitored site, with species richness, acoustic complexity and raised flags at a glance.",
};

export default function SitesPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 sm:py-20">
      <header data-reveal="up" className="max-w-[62ch]">
        <Eyebrow>Sites</Eyebrow>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] font-extrabold text-[clamp(2.1rem,5vw,3.4rem)] leading-[1.04] tracking-[-0.035em]">
          Every site, and how it is trending.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[var(--hb-ink-soft)]">
          Each card summarises twelve weekly recordings. Open a site for the
          full trend, the expected-vs-observed comparison and the detections
          still awaiting review.
        </p>
      </header>

      <ul
        data-reveal="up"
        data-stagger
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-2"
      >
        {SITES.map((site) => {
          const s = siteSummary(site.id);
          const flags = flagsForSite(site.id);
          const high = flags.filter((f) => f.severity === "high").length;

          return (
            <li key={site.id}>
              <TiltCard max={6} lift={8} glare={false} className="h-full">
                <Link
                  href={`/sites/${site.id}`}
                  className="group flex flex-col h-full rounded-3xl hb-glass p-6
                             transition-shadow duration-300 hover:shadow-[var(--hb-shadow-float)]"
                  style={{ transitionTimingFunction: "var(--hb-ease-out)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-[family-name:var(--font-heading)] font-bold text-[20px] leading-tight tracking-[-0.02em] wrap-anywhere">
                        {site.name}
                      </h2>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--hb-ink-muted)]">
                        <MapPin className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                        <span className="truncate">{site.region}</span>
                      </p>
                    </div>
                    <ArrowUpRight
                      className="size-5 shrink-0 text-[var(--hb-ink-muted)] transition-transform duration-200
                                 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--hb-primary)]"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusChip status={site.status} />
                    <span className="text-[12.5px] px-2.5 py-1 rounded-full bg-[var(--hb-card-sunk)] text-[var(--hb-ink-soft)]">
                      {site.habitat}
                    </span>
                    {flags.length > 0 && (
                      <span
                        className="text-[12.5px] font-semibold px-2.5 py-1 rounded-full tabular"
                        style={{
                          background: high ? "rgba(179,38,30,0.09)" : "rgba(154,84,8,0.09)",
                          color: high ? "var(--hb-danger)" : "var(--hb-warn)",
                        }}
                      >
                        {flags.length} flag{flags.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <dl className="mt-5 grid grid-cols-4 gap-2">
                    {[
                      { k: "Recordings", v: s.recordings },
                      { k: "Richness", v: s.richness },
                      { k: "ACI", v: s.aci.recent },
                      { k: "Gaps", v: s.missingCount },
                    ].map((m) => (
                      <div key={m.k} className="rounded-xl bg-[var(--hb-card-sunk)] px-3 py-2.5">
                        <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--hb-ink-muted)]">
                          {m.k}
                        </dt>
                        <dd className="mt-0.5 text-[19px] font-bold tabular leading-none">
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-auto pt-5 flex items-center gap-1.5 text-[12.5px] text-[var(--hb-ink-muted)]">
                    <Radio className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                    Median ACI{" "}
                    <span
                      className="font-semibold tabular"
                      style={{
                        color: s.aci.delta >= 0 ? "var(--hb-ok)" : "var(--hb-danger)",
                      }}
                    >
                      {s.aci.delta >= 0 ? "▲" : "▼"} {Math.abs(s.aci.delta)}%
                    </span>{" "}
                    vs. previous four
                  </p>
                </Link>
              </TiltCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

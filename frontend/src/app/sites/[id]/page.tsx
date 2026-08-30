import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Layers,
  Waves,
  Bird,
  CalendarDays,
} from "lucide-react";

import {
  SITES,
  siteById,
  siteSummary,
  trendForSite,
  expectedVsObserved,
  flagsForSite,
  recordingsForSite,
  formatDate,
  STATUS_META,
} from "@/lib/data";
import { StatusChip, StatTile } from "@/components/ui/Primitives";
import TrendChart from "@/components/charts/TrendChart";
import GuildChart from "@/components/charts/GuildChart";
import ExpectedVsObserved from "@/components/dashboard/ExpectedVsObserved";
import FlagList from "@/components/dashboard/FlagList";
import DetectionReview from "@/components/dashboard/DetectionReview";

/* Every site is known at build time — prerender them all. */
export function generateStaticParams() {
  return SITES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const site = siteById.get(id);
  if (!site) return { title: "Site not found — Biophony" };
  return {
    title: `${site.name} — Biophony`,
    description: `Habitat health dashboard for ${site.name}, ${site.region}. Species richness, acoustic complexity and expected-vs-observed comparison.`,
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = siteById.get(id);
  if (!site) notFound();

  const summary = siteSummary(site.id);
  const trend = trendForSite(site.id);
  const rows = expectedVsObserved(site.id);
  const flags = flagsForSite(site.id);
  const recordings = recordingsForSite(site.id);
  const latest = recordings[recordings.length - 1];
  const meta = STATUS_META[site.status];

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-14">
      {/* Breadcrumb — this is three levels deep, so orientation matters. */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-[13.5px] text-[var(--hb-ink-muted)]">
          <li>
            <Link href="/" className="hover:text-[var(--hb-primary)] transition-colors">
              Overview
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/sites" className="hover:text-[var(--hb-primary)] transition-colors">
              Sites
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page" className="font-medium text-[var(--hb-ink)]">
              {site.name}
            </span>
          </li>
        </ol>
      </nav>

      <Link
        href="/sites"
        className="inline-flex items-center gap-1.5 mb-6 text-[14px] font-medium text-[var(--hb-primary-lo)]
                   hover:gap-2.5 transition-all duration-200"
      >
        <ChevronLeft className="size-4" strokeWidth={2.5} aria-hidden="true" />
        All sites
      </Link>

      {/* ---------------- Header ---------------- */}
      <header data-reveal="up" className="hb-glass rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-[clamp(1.8rem,4.4vw,2.8rem)] leading-[1.05] tracking-[-0.03em] wrap-anywhere">
                {site.name}
              </h1>
              <StatusChip status={site.status} />
            </div>

            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-[var(--hb-ink-soft)]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                {site.region}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                {site.habitat}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular">
                <CalendarDays className="size-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                Last recording {summary.latestDate ? formatDate(summary.latestDate) : "—"}
              </span>
            </p>

            <p className="mt-3 text-[14px] text-[var(--hb-ink-muted)] font-[family-name:var(--font-mono)] tabular">
              {site.lat.toFixed(4)}, {site.lon.toFixed(4)}
            </p>
          </div>

          <p
            className="text-[14px] leading-relaxed max-w-[34ch] rounded-xl px-4 py-3 shrink-0"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.description}
          </p>
        </div>
      </header>

      {/* ---------------- Stat tiles ---------------- */}
      <div data-reveal="up" data-stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Species richness"
          value={summary.richness}
          unit="spp."
          hint="Confirmed species in the most recent recording."
          icon={<Bird className="size-5" strokeWidth={2.25} />}
        />
        <StatTile
          label="Acoustic complexity"
          value={summary.aci.recent}
          delta={summary.aci.delta}
          hint="Median ACI, last 4 recordings. Independent of the classifier."
          icon={<Waves className="size-5" strokeWidth={2.25} />}
        />
        <StatTile
          label="Expected, not heard"
          value={summary.missingCount}
          unit="spp."
          hint="Present in GBIF range, absent from the last 4 recordings."
        />
        <StatTile
          label="Disturbance share"
          value={summary.disturbanceShare}
          unit="%"
          hint="Share of detected species associated with modified habitat."
        />
      </div>

      {/* ---------------- Charts + flags ---------------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr] items-start">
        <div data-reveal="up" className="space-y-6 min-w-0">
          <TrendChart
            data={trend}
            title="Richness and acoustic complexity over time"
            description={`${recordings.length} recordings. Species richness on the left axis, acoustic complexity index on the right.`}
          />
          <GuildChart data={trend} />
        </div>

        <div data-reveal="up" data-reveal-delay="0.1" className="min-w-0">
          <FlagList flags={flags} />
        </div>
      </div>

      {/* ---------------- Expected vs observed ---------------- */}
      <div data-reveal="up" className="mt-6">
        <ExpectedVsObserved rows={rows} />
      </div>

      {/* ---------------- Review ---------------- */}
      {latest && (
        <div data-reveal="up" className="mt-6">
          <DetectionReview recording={latest} />
        </div>
      )}

      {/* ---------------- Recording log ---------------- */}
      <section data-reveal="up" className="mt-6 hb-glass rounded-2xl p-5 sm:p-6" aria-label="Recording log">
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-[18px] tracking-[-0.02em]">
          Recording log
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--hb-ink-muted)]">
          Every sample collected at this site, newest first.
        </p>

        <div className="mt-5 overflow-x-auto -mx-1 px-1">
          <table className="w-full text-[13.5px] border-collapse min-w-[560px]">
            <thead>
              <tr>
                {["Date", "Duration", "Richness", "ACI", "Uploaded by"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="text-left py-2.5 px-3 font-semibold text-[12px] uppercase tracking-wider
                               text-[var(--hb-ink-muted)] border-b border-[var(--hb-border)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...recordings].reverse().map((r) => (
                <tr key={r.id} className="border-b border-[var(--hb-border)]">
                  <th scope="row" className="text-left py-3 px-3 font-medium whitespace-nowrap tabular">
                    {formatDate(r.date)}
                  </th>
                  <td className="py-3 px-3 tabular">{r.durationSec}s</td>
                  <td className="py-3 px-3 tabular font-semibold">{r.richness}</td>
                  <td className="py-3 px-3 tabular">{r.aci}</td>
                  <td className="py-3 px-3 text-[var(--hb-ink-soft)] wrap-anywhere">
                    {r.uploader}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { GUILD_META, type ExpectedRow, formatDate } from "@/lib/data";
import { GuildChip } from "@/components/ui/Primitives";

type SortKey = "guild" | "recent" | "lastHeard";

/**
 * Expected-vs-observed comparison.
 *
 * "Expected" stands in for a GBIF occurrence query at the site's coordinates.
 * The rows that matter are the ones expected but no longer observed.
 */
export default function ExpectedVsObserved({ rows }: { rows: ExpectedRow[] }) {
  const [sort, setSort] = useState<SortKey>("guild");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [onlyGaps, setOnlyGaps] = useState(false);

  const toggle = (key: SortKey) => {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir(key === "guild" ? "asc" : "desc");
    }
  };

  const filtered = onlyGaps
    ? rows.filter((r) => r.expected && r.recent === 0)
    : rows;

  const sorted = [...filtered].sort((a, b) => {
    const m = dir === "asc" ? 1 : -1;
    if (sort === "recent") return (a.recent - b.recent) * m;
    if (sort === "lastHeard") {
      return ((a.lastHeard ?? "").localeCompare(b.lastHeard ?? "")) * m;
    }
    const order = { indicator: 0, disturbance: 1, generalist: 2 };
    return (order[a.species.guild] - order[b.species.guild]) * m;
  });

  const gapCount = rows.filter((r) => r.expected && r.recent === 0).length;
  const ariaSort = (key: SortKey) =>
    sort === key ? (dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <section className="hb-glass rounded-2xl p-5 sm:p-6" aria-label="Expected versus observed species">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-heading)] font-bold text-[18px] tracking-[-0.02em]">
            Expected vs. observed
          </h3>
          <p className="mt-1 text-[13.5px] text-[var(--hb-ink-muted)] max-w-[58ch]">
            Expected species come from GBIF occurrence records at this site&apos;s
            coordinates. Observed counts cover the four most recent recordings.
          </p>
        </div>

        <label
          className="flex items-center gap-2.5 shrink-0 rounded-lg px-3 min-h-[44px] cursor-pointer
                     border border-[var(--hb-border)] bg-white/70"
        >
          <input
            type="checkbox"
            checked={onlyGaps}
            onChange={(e) => setOnlyGaps(e.target.checked)}
            className="size-4 accent-[var(--hb-primary)] cursor-pointer"
          />
          <span className="text-[13.5px] font-medium">
            Gaps only{" "}
            <span className="tabular text-[var(--hb-ink-muted)]">({gapCount})</span>
          </span>
        </label>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-6 rounded-xl bg-[var(--hb-card-sunk)] p-6 text-center text-[14px] text-[var(--hb-ink-muted)]">
          No gaps at this site — every expected species was detected in the last
          four recordings.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto -mx-1 px-1">
          <table className="w-full text-[13.5px] border-collapse min-w-[620px]">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-left py-2.5 px-3 font-semibold text-[12px] uppercase tracking-wider
                             text-[var(--hb-ink-muted)] border-b border-[var(--hb-border)]"
                >
                  Species
                </th>
                <th
                  scope="col"
                  aria-sort={ariaSort("guild")}
                  className="text-left py-2.5 px-3 border-b border-[var(--hb-border)]"
                >
                  <button
                    type="button"
                    onClick={() => toggle("guild")}
                    className="font-semibold text-[12px] uppercase tracking-wider text-[var(--hb-ink-muted)]
                               hover:text-[var(--hb-primary)] transition-colors inline-flex items-center gap-1"
                  >
                    Guild
                    <span aria-hidden="true">{sort === "guild" ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
                <th
                  scope="col"
                  className="text-left py-2.5 px-3 font-semibold text-[12px] uppercase tracking-wider
                             text-[var(--hb-ink-muted)] border-b border-[var(--hb-border)] whitespace-nowrap"
                >
                  Expected
                </th>
                <th
                  scope="col"
                  aria-sort={ariaSort("recent")}
                  className="text-left py-2.5 px-3 border-b border-[var(--hb-border)]"
                >
                  <button
                    type="button"
                    onClick={() => toggle("recent")}
                    className="font-semibold text-[12px] uppercase tracking-wider text-[var(--hb-ink-muted)]
                               hover:text-[var(--hb-primary)] transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    Observed
                    <span aria-hidden="true">{sort === "recent" ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={ariaSort("lastHeard")}
                  className="text-left py-2.5 px-3 border-b border-[var(--hb-border)]"
                >
                  <button
                    type="button"
                    onClick={() => toggle("lastHeard")}
                    className="font-semibold text-[12px] uppercase tracking-wider text-[var(--hb-ink-muted)]
                               hover:text-[var(--hb-primary)] transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    Last heard
                    <span aria-hidden="true">{sort === "lastHeard" ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {sorted.map((row) => {
                const gap = row.expected && row.recent === 0;
                const trend =
                  row.recent > row.prior ? "up" : row.recent < row.prior ? "down" : "flat";

                return (
                  <tr
                    key={row.species.id}
                    className="border-b border-[var(--hb-border)]"
                    style={gap ? { background: "rgba(179,38,30,0.04)" } : undefined}
                  >
                    <th scope="row" className="text-left py-3 px-3 font-normal">
                      <span className="font-semibold text-[var(--hb-ink)] block wrap-anywhere">
                        {row.species.common}
                      </span>
                      <span className="italic text-[12.5px] text-[var(--hb-ink-muted)] block wrap-anywhere">
                        {row.species.scientific}
                      </span>
                    </th>

                    <td className="py-3 px-3">
                      <GuildChip guild={row.species.guild} />
                    </td>

                    <td className="py-3 px-3">
                      {row.expected ? (
                        <span className="inline-flex items-center gap-1.5 text-[var(--hb-ok)] font-medium">
                          <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[var(--hb-ink-muted)]">
                          <Minus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                          Out of range
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="tabular font-semibold">
                          {row.recent}
                          <span className="font-normal text-[var(--hb-ink-muted)]">/4</span>
                        </span>
                        {trend !== "flat" && (
                          <>
                            {trend === "up" ? (
                              <TrendingUp
                                className="size-4 text-[var(--hb-ok)]"
                                strokeWidth={2.5}
                                aria-hidden="true"
                              />
                            ) : (
                              <TrendingDown
                                className="size-4 text-[var(--hb-danger)]"
                                strokeWidth={2.5}
                                aria-hidden="true"
                              />
                            )}
                            <span className="sr-only">
                              {trend === "up" ? "Up" : "Down"} from {row.prior} in the
                              previous four recordings
                            </span>
                          </>
                        )}
                      </span>
                      {gap && (
                        <span className="block mt-1 text-[12px] font-semibold text-[var(--hb-danger)]">
                          Expected, not detected
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 tabular whitespace-nowrap text-[var(--hb-ink-soft)]">
                      {row.lastHeard ? formatDate(row.lastHeard) : "Never"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend for the guild classification used above. */}
      <dl className="mt-5 grid gap-2 sm:grid-cols-3 pt-4 border-t border-[var(--hb-border)]">
        {(Object.keys(GUILD_META) as Array<keyof typeof GUILD_META>).map((g) => (
          <div key={g} className="flex gap-2">
            <span
              aria-hidden="true"
              className="mt-1.5 size-2 rounded-[1px] rotate-45 shrink-0"
              style={{ background: GUILD_META[g].color }}
            />
            <div className="min-w-0">
              <dt className="text-[12.5px] font-semibold" style={{ color: GUILD_META[g].color }}>
                {GUILD_META[g].label}
              </dt>
              <dd className="text-[12px] leading-snug text-[var(--hb-ink-muted)]">
                {GUILD_META[g].note}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

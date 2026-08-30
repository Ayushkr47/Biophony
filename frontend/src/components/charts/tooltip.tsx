"use client";

/**
 * Shared tooltip for every chart.
 *
 * Recharts v3 no longer exports a usable public props type for custom
 * `content` components, so the shape the library actually passes is declared
 * here once rather than re-derived (and re-broken) in each chart.
 */

export type TooltipEntry = {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
};

export type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
};

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-[13px]"
      style={{
        background: "rgba(255,255,255,0.97)",
        border: "1px solid var(--hb-border)",
        boxShadow: "var(--hb-shadow-lg)",
      }}
    >
      <p className="font-semibold text-[var(--hb-ink)]">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {payload.map((p, i) => (
          <li key={String(p.dataKey ?? i)} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-sm shrink-0"
              style={{ background: p.color }}
            />
            <span className="text-[var(--hb-ink-soft)]">{p.name}</span>
            <span className="ml-auto font-semibold tabular text-[var(--hb-ink)]">
              {p.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Axis tick styling shared by every chart. */
export const AXIS = {
  stroke: "var(--hb-ink-muted)",
  fontSize: 12,
  fontFamily: "var(--font-body)",
};

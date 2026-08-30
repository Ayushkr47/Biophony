"use client";

import { useId, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Table2, LineChart as LineChartIcon } from "lucide-react";
import type { TrendPoint } from "@/lib/data";
import { ChartTooltip, AXIS } from "./tooltip";

/* ------------------------------------------------------------------ */

export default function TrendChart({
  data,
  title,
  description,
}: {
  data: TrendPoint[];
  title: string;
  description: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const gradId = useId().replace(/:/g, "");
  const tableId = useId();

  if (!data.length) {
    return (
      <div className="hb-glass rounded-2xl p-8 text-center">
        <h3 className="font-semibold text-[16px]">{title}</h3>
        <p className="mt-2 text-[14px] text-[var(--hb-ink-muted)]">
          No recordings for this site yet. Upload one to start the trend.
        </p>
      </div>
    );
  }

  const first = data[0];
  const last = data[data.length - 1];
  const summary = `${title}. ${data.length} recordings from ${first.label} to ${last.label}. Species richness moved from ${first.richness} to ${last.richness}. Acoustic complexity index moved from ${first.aci} to ${last.aci}.`;

  return (
    <figure className="hb-glass rounded-2xl p-5 sm:p-6 m-0">
      <figcaption className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-heading)] font-bold text-[18px] tracking-[-0.02em]">
            {title}
          </h3>
          <p className="mt-1 text-[13.5px] text-[var(--hb-ink-muted)] max-w-[56ch]">
            {description}
          </p>
        </div>

        {/* Table view is a first-class alternative, not a fallback. */}
        <div
          role="group"
          aria-label="Change view"
          className="flex rounded-lg p-0.5 shrink-0"
          style={{ background: "var(--hb-card-sunk)" }}
        >
          {(["chart", "table"] as const).map((v) => {
            const Icon = v === "chart" ? LineChartIcon : Table2;
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={active}
                className="inline-flex items-center gap-1.5 rounded-md px-3 min-h-[36px] text-[13px] font-semibold
                           transition-colors duration-150"
                style={{
                  background: active ? "#fff" : "transparent",
                  color: active ? "var(--hb-primary-lo)" : "var(--hb-ink-muted)",
                  boxShadow: active ? "var(--hb-shadow-sm)" : "none",
                }}
              >
                <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
                {v === "chart" ? "Chart" : "Table"}
              </button>
            );
          })}
        </div>
      </figcaption>

      {view === "chart" ? (
        <>
          {/* The insight, for anyone who cannot see the chart. */}
          <p className="sr-only">{summary}</p>
          <div className="h-[300px] sm:h-[340px]" role="img" aria-label={summary}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 24, left: 0 }}
              >
                <defs>
                  <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--hb-viz-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--hb-viz-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                {/* Gridlines stay low-contrast so they never compete with data. */}
                <CartesianGrid stroke="var(--hb-border)" strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="label"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={{ stroke: "var(--hb-border)" }}
                  interval="preserveStartEnd"
                  minTickGap={18}
                />
                <YAxis
                  yAxisId="left"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  label={{
                    value: "Species",
                    angle: -90,
                    position: "insideLeft",
                    style: { ...AXIS, fontSize: 11.5 },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  label={{
                    value: "ACI",
                    angle: 90,
                    position: "insideRight",
                    style: { ...AXIS, fontSize: 11.5 },
                  }}
                />

                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--hb-border-strong)" }} />
                <Legend
                  verticalAlign="bottom"
                  height={30}
                  wrapperStyle={{ fontSize: 13, fontFamily: "var(--font-body)" }}
                />

                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="richness"
                  name="Species richness"
                  stroke="var(--hb-viz-1)"
                  strokeWidth={2.5}
                  fill={`url(#fill-${gradId})`}
                  dot={{ r: 3, strokeWidth: 0, fill: "var(--hb-viz-1)" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="aci"
                  name="Acoustic complexity (ACI)"
                  stroke="var(--hb-viz-3)"
                  strokeWidth={2.5}
                  /* Dashed, so the two series are distinguishable without colour. */
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table id={tableId} className="w-full text-[13.5px] border-collapse">
            <caption className="sr-only">{summary}</caption>
            <thead>
              <tr className="text-left">
                {["Date", "Richness", "ACI", "Indicator spp.", "Disturbance spp."].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="py-2.5 px-3 font-semibold text-[12px] uppercase tracking-wider
                               text-[var(--hb-ink-muted)] border-b border-[var(--hb-border)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date} className="border-b border-[var(--hb-border)]">
                  <th scope="row" className="py-2.5 px-3 font-medium text-left whitespace-nowrap">
                    {d.label}
                  </th>
                  <td className="py-2.5 px-3 tabular">{d.richness}</td>
                  <td className="py-2.5 px-3 tabular">{d.aci}</td>
                  <td className="py-2.5 px-3 tabular">{d.indicator}</td>
                  <td className="py-2.5 px-3 tabular">{d.disturbance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { TrendPoint } from "@/lib/data";
import { ChartTooltip, AXIS } from "./tooltip";

/**
 * Indicator vs. disturbance species counts per recording.
 *
 * The two series diverging is the signal — indicators falling while
 * disturbance-associated species rise is the classic degradation pattern.
 */
export default function GuildChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const summary = `Indicator species per recording moved from ${first.indicator} to ${last.indicator}, while disturbance-associated species moved from ${first.disturbance} to ${last.disturbance}, across ${data.length} recordings.`;

  return (
    <figure className="hb-glass rounded-2xl p-5 sm:p-6 m-0">
      <figcaption className="mb-5">
        <h3 className="font-[family-name:var(--font-heading)] font-bold text-[18px] tracking-[-0.02em]">
          Community composition
        </h3>
        <p className="mt-1 text-[13.5px] text-[var(--hb-ink-muted)] max-w-[56ch]">
          Indicator species falling while disturbance-associated species rise is
          the pattern worth acting on — more than either series alone.
        </p>
      </figcaption>

      <p className="sr-only">{summary}</p>
      <div className="h-[260px]" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 20, left: 0 }}>
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
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={38}
              allowDecimals={false}
              label={{
                value: "Species",
                angle: -90,
                position: "insideLeft",
                style: { ...AXIS, fontSize: 11.5 },
              }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(11,110,90,0.06)" }} />
            <Legend
              verticalAlign="bottom"
              height={28}
              wrapperStyle={{ fontSize: 13, fontFamily: "var(--font-body)" }}
            />
            <Bar
              dataKey="indicator"
              name="Indicator species"
              fill="var(--hb-viz-1)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="disturbance"
              name="Disturbance-associated"
              fill="var(--hb-viz-2)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

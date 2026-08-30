import {
  BellOff,
  TrendingUp,
  Waves,
  ArrowDownRight,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { type Flag, formatDate } from "@/lib/data";

const KIND_META: Record<Flag["kind"], { icon: LucideIcon; label: string }> = {
  "silent-indicator": { icon: BellOff, label: "Indicator gone quiet" },
  "disturbance-rise": { icon: TrendingUp, label: "Disturbance rising" },
  "aci-decline": { icon: Waves, label: "Complexity falling" },
  "richness-drop": { icon: ArrowDownRight, label: "Richness falling" },
};

const SEVERITY = {
  high: { color: "var(--hb-danger)", bg: "rgba(179,38,30,0.07)", label: "High" },
  medium: { color: "var(--hb-warn)", bg: "rgba(154,84,8,0.07)", label: "Medium" },
  low: { color: "var(--hb-info)", bg: "rgba(14,116,144,0.07)", label: "Low" },
} as const;

export default function FlagList({ flags }: { flags: Flag[] }) {
  if (!flags.length) {
    return (
      <section className="hb-glass rounded-2xl p-6" aria-label="Flags">
        <h3 className="font-[family-name:var(--font-heading)] font-bold text-[18px] tracking-[-0.02em]">
          Flags
        </h3>
        <div className="mt-4 flex items-start gap-3 rounded-xl p-5"
             style={{ background: "rgba(11,110,90,0.06)" }}>
          <ShieldCheck
            className="size-5 shrink-0 mt-0.5"
            strokeWidth={2.25}
            color="var(--hb-ok)"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-[15px] text-[var(--hb-ok)]">
              No flags raised
            </p>
            <p className="mt-1 text-[13.5px] text-[var(--hb-ink-soft)]">
              Indicator species are still being detected, disturbance-associated
              species are not gaining share, and acoustic complexity is holding.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hb-glass rounded-2xl p-5 sm:p-6" aria-label="Flags">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-[family-name:var(--font-heading)] font-bold text-[18px] tracking-[-0.02em]">
          Flags
        </h3>
        <p className="text-[13px] text-[var(--hb-ink-muted)] tabular">
          {flags.length} raised
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {flags.map((flag) => {
          const kind = KIND_META[flag.kind];
          const sev = SEVERITY[flag.severity];
          const Icon = kind.icon;

          return (
            <li
              key={flag.id}
              className="rounded-xl p-4 border"
              style={{ background: sev.bg, borderColor: sev.color + "2e" }}
            >
              <div className="flex gap-3.5">
                <span
                  className="grid place-items-center size-10 rounded-xl shrink-0"
                  style={{ background: "rgba(255,255,255,0.75)" }}
                >
                  <Icon
                    className="size-5"
                    strokeWidth={2.25}
                    color={sev.color}
                    aria-hidden="true"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-[15px] leading-snug wrap-anywhere">
                      {flag.title}
                    </h4>
                    {/* Severity is text + colour, never colour alone. */}
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: sev.color, background: "rgba(255,255,255,0.8)" }}
                    >
                      {sev.label}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--hb-ink-soft)]">
                    {flag.detail}
                  </p>

                  <p className="mt-2.5 text-[12px] text-[var(--hb-ink-muted)]">
                    <span className="font-medium">{kind.label}</span>
                    {" · raised "}
                    <span className="tabular">{formatDate(flag.raised)}</span>
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

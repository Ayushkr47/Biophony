import type { ReactNode } from "react";
import { STATUS_META, type SiteStatus, type Guild, GUILD_META } from "@/lib/data";

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

export function Section({
  children,
  className = "",
  id,
  label,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  label?: string;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={`relative mx-auto max-w-7xl px-5 sm:px-8 ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--hb-primary)]">
      <span
        aria-hidden="true"
        className="inline-block h-px w-6"
        style={{ background: "var(--hb-primary)" }}
      />
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Status + guild chips                                                */
/* ------------------------------------------------------------------ */

export function StatusChip({
  status,
  size = "md",
}: {
  status: SiteStatus;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${
        size === "sm" ? "px-2.5 py-1 text-[11.5px]" : "px-3 py-1.5 text-[12.5px]"
      }`}
      style={{ background: meta.bg, color: meta.color }}
    >
      {/* Shape + text carry the meaning; colour only reinforces it. */}
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full hb-live-dot"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}

export function GuildChip({ guild }: { guild: Guild }) {
  const meta = GUILD_META[guild];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap"
      style={{ color: meta.color, background: "var(--hb-card-sunk)" }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-[1px] rotate-45"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export function StatTile({
  label,
  value,
  unit,
  delta,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  /** Percentage change. Direction is shown with an arrow glyph, not colour alone. */
  delta?: number;
  hint?: string;
  icon?: ReactNode;
}) {
  const dir = delta === undefined ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const deltaColor =
    dir === "up" ? "var(--hb-ok)" : dir === "down" ? "var(--hb-danger)" : "var(--hb-ink-muted)";

  return (
    <div className="hb-glass rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-[var(--hb-ink-muted)]">
          {label}
        </p>
        {icon && (
          <span className="text-[var(--hb-primary)] shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="font-[family-name:var(--font-heading)] text-[34px] font-bold leading-none tabular text-[var(--hb-ink)]">
          {value}
        </span>
        {unit && (
          <span className="text-[13px] font-medium text-[var(--hb-ink-muted)]">
            {unit}
          </span>
        )}
      </p>

      {dir && (
        <p
          className="mt-2 flex items-center gap-1 text-[13px] font-semibold tabular"
          style={{ color: deltaColor }}
        >
          <span aria-hidden="true">
            {dir === "up" ? "▲" : dir === "down" ? "▼" : "■"}
          </span>
          <span>
            {delta! > 0 ? "+" : ""}
            {delta}%
          </span>
          <span className="font-normal text-[var(--hb-ink-muted)]">
            vs. previous 4
          </span>
        </p>
      )}

      {hint && (
        <p className="mt-auto pt-3 text-[12.5px] leading-relaxed text-[var(--hb-ink-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function PrimaryButton({
  children,
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const cls = `hb-sheen inline-flex items-center justify-center gap-2 rounded-xl px-6 min-h-[48px]
     font-semibold text-white text-[15px]
     transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
     disabled:hover:translate-y-0 ${className}`;
  const style: React.CSSProperties = {
    background: "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary))",
    boxShadow: "var(--hb-shadow-glow)",
    transitionTimingFunction: "var(--hb-ease-out)",
  };

  if (href) {
    return (
      <a href={href} className={cls} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  href,
  onClick,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-6 min-h-[48px]
     font-semibold text-[15px] text-[var(--hb-primary-lo)]
     bg-white/70 backdrop-blur border border-[var(--hb-border-strong)]
     transition-all duration-200 hover:bg-white hover:-translate-y-0.5
     active:translate-y-0 active:scale-[0.98] ${className}`;
  const style = { transitionTimingFunction: "var(--hb-ease-out)" };

  if (href) {
    return (
      <a href={href} className={cls} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Empty / limitation notice                                           */
/* ------------------------------------------------------------------ */

export function Notice({
  tone = "info",
  title,
  children,
  icon,
}: {
  tone?: "info" | "warn" | "danger";
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  const color =
    tone === "warn"
      ? "var(--hb-warn)"
      : tone === "danger"
        ? "var(--hb-danger)"
        : "var(--hb-info)";
  const bg =
    tone === "warn"
      ? "rgba(154,84,8,0.07)"
      : tone === "danger"
        ? "rgba(179,38,30,0.07)"
        : "rgba(14,116,144,0.07)";

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: bg, borderColor: color + "33" }}
    >
      <div className="flex gap-3">
        {icon && (
          <span className="shrink-0 mt-0.5" style={{ color }} aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-[15px]" style={{ color }}>
            {title}
          </h3>
          <div className="mt-1.5 text-[14px] leading-relaxed text-[var(--hb-ink-soft)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

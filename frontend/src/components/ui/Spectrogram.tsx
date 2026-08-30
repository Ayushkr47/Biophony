"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Decorative spectrogram strip.
 *
 * Deterministic geometry (seeded, no Math.random at render) so server and
 * client agree. The sweep is a single transform-only animation; it stops for
 * reduced-motion users, who still see the full static spectrogram.
 */
export default function Spectrogram({
  bars = 64,
  seed = 7,
  height = 92,
  className = "",
  animate = true,
}: {
  bars?: number;
  seed?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}) {
  const sweepRef = useRef<HTMLDivElement>(null);

  const cols = useMemo(() => {
    // Small deterministic LCG — same output every render, every environment.
    let s = seed * 9301 + 49297;
    const next = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: bars }, (_, i) => {
      const envelope = Math.sin((i / bars) * Math.PI) * 0.55 + 0.45;
      const burst = next() > 0.82 ? 0.9 : 0;
      const v = Math.min(1, (next() * 0.62 + burst) * envelope + 0.12);
      return v;
    });
  }, [bars, seed]);

  useEffect(() => {
    if (!animate) return;
    const el = sweepRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let t = 0;
    const loop = () => {
      t = (t + 0.0022) % 1;
      el.style.transform = `translateX(${(t * 100).toFixed(2)}%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ height, background: "var(--hb-card-sunk)" }}
    >
      <div className="absolute inset-0 flex items-end gap-[2px] px-2 pb-2">
        {cols.map((v, i) => (
          /* Values are rounded and the gradient kept on one line: the browser
             normalises inline styles when parsing, and a high-precision or
             multi-line value round-trips differently, which React reports as
             a hydration mismatch. */
          <div
            key={i}
            className="flex-1 rounded-[2px]"
            style={{
              height: `${Math.max(6, v * 100).toFixed(2)}%`,
              background: `linear-gradient(180deg, color-mix(in oklab, var(--hb-glow) ${Math.round(v * 88)}%, var(--hb-primary)) 0%, var(--hb-primary) 100%)`,
              opacity: Number((0.35 + v * 0.6).toFixed(3)),
            }}
          />
        ))}
      </div>

      {/* Playhead sweep */}
      {animate && (
        <div
          ref={sweepRef}
          className="absolute inset-y-0 left-0 w-[42%] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 78%, rgba(255,255,255,0.85) 100%)",
            mixBlendMode: "overlay",
          }}
        />
      )}
    </div>
  );
}

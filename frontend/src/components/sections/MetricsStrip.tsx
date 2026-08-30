"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const METRICS = [
  { value: 48, suffix: "", label: "Recordings analysed", hint: "12 per site, weekly" },
  { value: 16, suffix: "", label: "Species tracked", hint: "Across three guilds" },
  { value: 60, suffix: "s", label: "Max clip length", hint: "Processed async" },
  { value: 0, suffix: "", label: "API keys needed", hint: "GBIF is free and keyless" },
];

/**
 * Count-up metrics.
 *
 * Values are rendered in the DOM at their final state and only animated once
 * JS confirms motion is allowed — so no-JS and reduced-motion users read the
 * real numbers immediately rather than a row of zeros.
 */
export default function MetricsStrip() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const nums = gsap.utils.toArray<HTMLElement>("[data-count]", root);

      const tweens = nums.map((el) => {
        const target = Number(el.dataset.count || "0");
        const obj = { v: 0 };
        return gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
        });
      });

      return () => tweens.forEach((t) => t.kill());
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      className="relative mx-auto max-w-7xl px-5 sm:px-8 pb-8"
      aria-label="Key figures"
    >
      <div
        ref={rootRef}
        data-reveal="up"
        className="hb-glass-deep rounded-3xl px-6 py-7 sm:px-8"
      >
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label}>
              <dd className="font-[family-name:var(--font-heading)] text-[36px] font-bold leading-none tabular text-[var(--hb-primary-lo)]">
                <span data-count={m.value}>{m.value}</span>
                {m.suffix}
              </dd>
              <dt className="mt-2 text-[14.5px] font-semibold">{m.label}</dt>
              <p className="mt-0.5 text-[12.5px] text-[var(--hb-ink-muted)]">
                {m.hint}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

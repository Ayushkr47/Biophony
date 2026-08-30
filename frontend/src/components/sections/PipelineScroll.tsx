"use client";

import {
  Mic,
  Cpu,
  LineChart,
  Siren,
  type LucideIcon,
} from "lucide-react";
import Spectrogram from "@/components/ui/Spectrogram";
import { Eyebrow } from "@/components/ui/Primitives";

type Step = {
  n: string;
  title: string;
  body: string;
  icon: LucideIcon;
  visual: "record" | "infer" | "trend" | "flag";
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "A phone recording is enough",
    body: "Sixty seconds of field audio, tagged with a lat/long and a timestamp. No parabolic mic, no researcher training, no proprietary logger.",
    icon: Mic,
    visual: "record",
  },
  {
    n: "02",
    title: "BirdNET chunks and classifies",
    body: "Audio is split into 3-second windows and run through a TFLite model on CPU. Each window returns species with confidence scores — then a human confirms or rejects them.",
    icon: Cpu,
    visual: "infer",
  },
  {
    n: "03",
    title: "The site becomes a time series",
    body: "This is the part that matters. Every recording is a sample of one place. Richness, detection counts and acoustic complexity are trended across every recording that site has.",
    icon: LineChart,
    visual: "trend",
  },
  {
    n: "04",
    title: "Divergence raises a flag",
    body: "An indicator species that stops appearing. A rising share of disturbance-associated species. Falling acoustic complexity. Each is a specific, checkable claim — not a vibe.",
    icon: Siren,
    visual: "flag",
  },
];

/* ------------------------------------------------------------------ */

function StepVisual({ kind }: { kind: Step["visual"] }) {
  if (kind === "record") {
    return (
      <div className="hb-glass rounded-2xl p-5">
        <Spectrogram height={130} seed={31} bars={80} />
        <div className="mt-4 flex items-center justify-between text-[12.5px] tabular text-[var(--hb-ink-muted)]">
          <span>00:00</span>
          <span className="font-semibold text-[var(--hb-primary)]">52s · 48 kHz mono</span>
          <span>00:52</span>
        </div>
      </div>
    );
  }

  if (kind === "infer") {
    return (
      <div className="hb-glass rounded-2xl p-5">
        <div className="grid grid-cols-8 gap-1.5" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => {
            // Deterministic: fixed windows are "hits", no randomness at render.
            const hit = i % 5 === 0 || i % 7 === 3;
            return (
              <div
                key={i}
                className="aspect-square rounded-[5px]"
                style={{
                  background: hit
                    ? "linear-gradient(145deg, var(--hb-glow), var(--hb-primary))"
                    : "var(--hb-card-sunk)",
                  boxShadow: hit ? "0 4px 10px -3px rgba(11,110,90,0.4)" : "none",
                }}
              />
            );
          })}
        </div>
        <p className="mt-4 text-[13px] text-[var(--hb-ink-soft)]">
          <strong className="font-semibold text-[var(--hb-ink)] tabular">24</strong>{" "}
          windows ·{" "}
          <strong className="font-semibold text-[var(--hb-primary)] tabular">7</strong>{" "}
          with a detection above threshold
        </p>
      </div>
    );
  }

  if (kind === "trend") {
    const pts = [8, 9, 9, 11, 10, 12, 11, 13, 12, 13, 14, 13];
    const max = 16;
    return (
      <div className="hb-glass rounded-2xl p-5">
        <div className="flex items-end gap-1.5 h-[130px]" aria-hidden="true">
          {pts.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="rounded-t-[4px]"
                style={{
                  height: `${(v / max) * 100}%`,
                  background:
                    i >= pts.length - 3
                      ? "linear-gradient(180deg, var(--hb-glow), var(--hb-primary))"
                      : "var(--hb-border-strong)",
                }}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-[var(--hb-ink-soft)]">
          12 recordings · species richness per visit, oldest to newest
        </p>
      </div>
    );
  }

  return (
    <div className="hb-glass rounded-2xl p-5 space-y-2.5">
      {[
        { t: "Malabar Trogon has gone quiet", s: "high" },
        { t: "Disturbance species share up to 38%", s: "medium" },
        { t: "Median ACI down 7.9%", s: "medium" },
      ].map((f) => {
        const color = f.s === "high" ? "var(--hb-danger)" : "var(--hb-warn)";
        const bg = f.s === "high" ? "rgba(179,38,30,0.07)" : "rgba(154,84,8,0.07)";
        return (
          <div
            key={f.t}
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 border"
            style={{ background: bg, borderColor: color + "2e" }}
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full shrink-0"
              style={{ background: color }}
            />
            <p className="text-[13.5px] font-medium">{f.t}</p>
            <span
              className="ml-auto text-[11px] font-bold uppercase tracking-wider shrink-0"
              style={{ color }}
            >
              {f.s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function PipelineScroll() {
  return (
    <>
      {/* Intro sits outside the pinned block so the pin starts cleanly. */}
      <section className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-8 pb-14">
        <div data-reveal="up" className="max-w-[62ch]">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.06] tracking-[-0.03em]">
            Four steps from a phone clip to an actionable flag.
          </h2>
        </div>
      </section>

      {/*
        Exactly one pinned section on the page — more than two fights native
        scroll feel. The pin only engages at lg and above; below that the
        steps are ordinary stacked content with standard reveals.

        The wrapper is load-bearing: ScrollTrigger's pin moves the section
        into a generated .pin-spacer, so on navigation React would try to
        remove the section from a parent it no longer has (NotFoundError).
        Removing this wrapper instead takes the whole subtree with it.
      */}
      <div className="relative">
      <section
        data-pin
        aria-label="Analysis pipeline"
        className="relative lg:min-h-dvh lg:flex lg:items-center py-4 lg:py-16"
      >
        <div className="mx-auto max-w-7xl w-full px-5 sm:px-8">
          <div className="relative lg:min-h-[420px]">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                /* Each step keeps its copy and visual together, so it reads
                   correctly whether stacked (mobile) or cross-faded (desktop). */
                <article
                  key={step.n}
                  data-pin-step={i}
                  data-reveal="up"
                  className="lg:absolute lg:inset-0 grid gap-8 lg:grid-cols-2 lg:gap-14
                             lg:items-center mb-16 lg:mb-0"
                >
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid place-items-center size-11 rounded-2xl shrink-0"
                        style={{
                          background:
                            "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary-lo))",
                          boxShadow: "var(--hb-shadow-glow)",
                        }}
                      >
                        <Icon className="size-5" strokeWidth={2.25} color="#fff" aria-hidden="true" />
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--hb-primary)] tabular">
                        {step.n} / 04
                      </span>
                    </div>

                    <h3 className="mt-5 font-[family-name:var(--font-heading)] font-bold text-[clamp(1.5rem,3.4vw,2.3rem)] leading-[1.1] tracking-[-0.025em]">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-[var(--hb-ink-soft)]">
                      {step.body}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <div className="w-full">
                      <StepVisual kind={step.visual} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

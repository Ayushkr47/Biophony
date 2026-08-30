"use client";

import Link from "next/link";
import { ArrowRight, Activity, MapPin, CheckCircle2, AudioLines } from "lucide-react";

import SplitHeadline from "@/components/motion/SplitHeadline";
import TiltCard from "@/components/ui/TiltCard";
import Spectrogram from "@/components/ui/Spectrogram";
import { Eyebrow } from "@/components/ui/Primitives";

export default function Hero() {
  return (
    <section
      className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-14 pb-24 sm:pt-20 sm:pb-32"
      aria-label="Introduction"
    >
      <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:items-center">
        {/* ---------------- Copy ---------------- */}
        <div className="relative" style={{ zIndex: 2 }}>
          <div data-reveal="fade" data-reveal-delay="0.05">
            <Eyebrow>Passive acoustic monitoring</Eyebrow>
          </div>

          <SplitHeadline
            text="Hear a habitat change before you can see it."
            accentWords={["before"]}
            delay={0.15}
            className="mt-5 font-[family-name:var(--font-heading)] font-extrabold
                       text-[clamp(2.35rem,6.2vw,4.25rem)] leading-[1.02] tracking-[-0.035em]"
          />

          <p
            data-reveal="up"
            data-reveal-delay="0.5"
            className="mt-6 max-w-[54ch] text-[17px] sm:text-[18px] leading-relaxed text-[var(--hb-ink-soft)]"
          >
            Biodiversity surveys happen once a year. A habitat can degrade for
            months before anyone notices. Upload a phone recording from the
            field and we treat it as a{" "}
            <strong className="font-semibold text-[var(--hb-ink)]">
              sample of a site over time
            </strong>
            {" "}— not a one-off species ID.
          </p>

          <div
            data-reveal="up"
            data-reveal-delay="0.62"
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/upload"
              className="hb-sheen inline-flex items-center justify-center gap-2 rounded-xl px-6 min-h-[52px]
                         font-semibold text-white text-[15px]
                         transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                background: "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary))",
                boxShadow: "var(--hb-shadow-glow)",
                transitionTimingFunction: "var(--hb-ease-out)",
              }}
            >
              Upload a recording
              <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </Link>

            <Link
              href="/sites"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 min-h-[52px]
                         font-semibold text-[15px] text-[var(--hb-primary-lo)]
                         bg-white/70 backdrop-blur border border-[var(--hb-border-strong)]
                         transition-all duration-200 hover:bg-white hover:-translate-y-0.5 active:translate-y-0"
              style={{ transitionTimingFunction: "var(--hb-ease-out)" }}
            >
              Explore 4 monitored sites
            </Link>
          </div>

          {/* Honest framing, up front rather than buried. */}
          <p
            data-reveal="fade"
            data-reveal-delay="0.75"
            className="mt-6 flex items-start gap-2 text-[13.5px] leading-relaxed text-[var(--hb-ink-muted)] max-w-[52ch]"
          >
            <CheckCircle2
              className="size-4 mt-0.5 shrink-0 text-[var(--hb-primary)]"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <span>
              Detections are model output, reviewable by hand. The acoustic
              complexity index runs independently of the classifier — so the
              habitat signal survives even when the species ID is wrong.
            </span>
          </p>
        </div>

        {/* ---------------- 3D card stack ---------------- */}
        <div
          className="relative hb-3d min-h-[420px] sm:min-h-[480px]"
          data-reveal="scale"
          data-reveal-delay="0.3"
        >
          {/* Soft ground glow so the stack reads as floating above a surface */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[78%] h-24 rounded-[50%] blur-2xl"
            style={{ background: "rgba(11,110,90,0.13)" }}
          />

          {/* Back card — site status */}
          <div
            data-parallax="-14"
            className="absolute right-0 top-2 w-[62%] max-w-[300px] hb-float"
            style={{ animationDelay: "-2s" }}
          >
            <TiltCard max={10} lift={8}>
              <div className="hb-glass rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-[var(--hb-primary)]" strokeWidth={2.25} aria-hidden="true" />
                  <p className="text-[13px] font-semibold truncate">Kanha Buffer Edge</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[var(--hb-card-sunk)] p-2.5">
                    <p className="text-[10.5px] uppercase tracking-wider text-[var(--hb-ink-muted)] font-semibold">
                      Richness
                    </p>
                    <p className="text-[19px] font-bold tabular leading-tight">9</p>
                  </div>
                  <div className="rounded-lg bg-[var(--hb-card-sunk)] p-2.5">
                    <p className="text-[10.5px] uppercase tracking-wider text-[var(--hb-ink-muted)] font-semibold">
                      ACI
                    </p>
                    <p className="text-[19px] font-bold tabular leading-tight">1462</p>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>

          {/* Front card — the recording being analysed */}
          <div
            data-parallax="8"
            className="absolute left-0 top-24 w-[86%] max-w-[420px]"
          >
            <TiltCard max={9} lift={14}>
              <div className="hb-glass rounded-3xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="grid place-items-center size-9 rounded-xl shrink-0"
                      style={{ background: "rgba(11,110,90,0.1)" }}
                    >
                      <AudioLines
                        className="size-4.5 text-[var(--hb-primary)]"
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold truncate">
                        agumbe_0546.wav
                      </p>
                      <p className="text-[11.5px] text-[var(--hb-ink-muted)] tabular">
                        05:46 IST · 52s · 13.5025, 75.0906
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 tabular"
                    style={{ background: "rgba(11,110,90,0.1)", color: "var(--hb-ok)" }}
                  >
                    Done
                  </span>
                </div>

                <Spectrogram className="mt-4" height={86} seed={19} bars={72} />

                <ul className="mt-4 space-y-2">
                  {[
                    { n: "Malabar Trogon", s: "Harpactes fasciatus", c: 0.91 },
                    { n: "White-cheeked Barbet", s: "Psilopogon viridis", c: 0.84 },
                    { n: "Orange-headed Thrush", s: "Geokichla citrina", c: 0.67 },
                  ].map((d) => (
                    <li
                      key={d.n}
                      className="flex items-center gap-3 rounded-lg bg-white/60 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold truncate">{d.n}</p>
                        <p className="text-[11px] italic text-[var(--hb-ink-muted)] truncate">
                          {d.s}
                        </p>
                      </div>
                      <div className="w-16 shrink-0">
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--hb-bg-deep)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${d.c * 100}%`,
                              background: "linear-gradient(90deg, var(--hb-primary), var(--hb-glow))",
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold tabular w-9 text-right shrink-0">
                        {d.c.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </TiltCard>
          </div>

          {/* Floating ACI pill */}
          <div
            data-parallax="-22"
            className="absolute right-2 bottom-6 hb-float"
            style={{ animationDelay: "-4s" }}
          >
            <TiltCard max={14} lift={6}>
              <div className="hb-glass-deep rounded-2xl px-4 py-3 flex items-center gap-3">
                <Activity className="size-5 text-[var(--hb-primary)]" strokeWidth={2.25} aria-hidden="true" />
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider font-semibold text-[var(--hb-ink-muted)]">
                    Acoustic complexity
                  </p>
                  <p className="text-[17px] font-bold tabular leading-tight">
                    1698{" "}
                    <span className="text-[12px] font-semibold text-[var(--hb-ok)]">
                      ▲ 3.4%
                    </span>
                  </p>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}

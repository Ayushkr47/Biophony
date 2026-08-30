"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bird, Globe2, Waves } from "lucide-react";
import { Eyebrow } from "@/components/ui/Primitives";

gsap.registerPlugin(ScrollTrigger);

const LAYERS = [
  {
    icon: Bird,
    title: "Layer 1 — What was heard",
    sub: "Species identification",
    body: "BirdNET returns species and confidence per 3-second window. Useful, but this is the layer everyone builds. On its own it is Shazam for birds.",
    depends: "Depends on the classifier being right",
    tone: "muted" as const,
  },
  {
    icon: Globe2,
    title: "Layer 2 — What should be there",
    sub: "Expected vs. observed",
    body: "GBIF occurrence records for the site's lat/long give a baseline of species that ought to be present. The gap between expected and observed is where the story is.",
    depends: "Depends on the classifier being right",
    tone: "mid" as const,
  },
  {
    icon: Waves,
    title: "Layer 3 — How alive it sounds",
    sub: "Acoustic complexity index",
    body: "A standard soundscape-ecology metric computed straight off the spectrogram. It measures the variability of the soundscape itself — so it keeps working even when species ID fails.",
    depends: "Independent of the classifier",
    tone: "accent" as const,
  },
];

export default function LayersSection() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();

    // Depth separation only where there is room for it, and only if the
    // user has not asked for reduced motion.
    mm.add(
      "(prefers-reduced-motion: no-preference) and (min-width: 768px)",
      () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-layer]", root);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top 78%",
            end: "bottom 62%",
            scrub: 0.8,
          },
        });

        cards.forEach((card, i) => {
          // Start collapsed into a single stack, then fan apart in Z.
          tl.fromTo(
            card,
            {
              y: 60 - i * 30,
              z: -140 + i * 40,
              rotateX: 16,
              scale: 0.92,
              opacity: 0.35,
            },
            {
              y: 0,
              z: 0,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              ease: "power2.out",
              duration: 1,
            },
            i * 0.18,
          );
        });

        return () => {
          tl.kill();
          gsap.set(cards, { clearProps: "all" });
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      className="relative mx-auto max-w-7xl px-5 sm:px-8 py-24"
      aria-label="Three layers of evidence"
    >
      <div data-reveal="up" className="max-w-[64ch]">
        <Eyebrow>Why this is not Shazam for birds</Eyebrow>
        <h2 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.06] tracking-[-0.03em]">
          Three layers of evidence, only one of which trusts the model.
        </h2>
        <p className="mt-5 text-[17px] leading-relaxed text-[var(--hb-ink-soft)]">
          Species classifiers are imperfect, and noticeably more so outside
          North America and Europe. So the habitat verdict does not rest on one.
        </p>
      </div>

      <div
        ref={wrapRef}
        className="mt-14 grid gap-5 md:grid-cols-3"
        style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
      >
        {LAYERS.map((layer) => {
          const Icon = layer.icon;
          const accent = layer.tone === "accent";
          return (
            <article
              key={layer.title}
              data-layer
              className="relative rounded-3xl p-6 flex flex-col"
              style={{
                transformStyle: "preserve-3d",
                background: accent
                  ? "linear-gradient(155deg, #ffffff 0%, #eefaf4 100%)"
                  : "rgba(255,255,255,0.86)",
                backdropFilter: "blur(18px) saturate(140%)",
                WebkitBackdropFilter: "blur(18px) saturate(140%)",
                border: accent
                  ? "1px solid rgba(11,110,90,0.28)"
                  : "1px solid rgba(255,255,255,0.9)",
                boxShadow: accent
                  ? "var(--hb-shadow-float), 0 0 0 4px rgba(52,211,153,0.12)"
                  : "var(--hb-shadow-lg)",
              }}
            >
              <span
                className="grid place-items-center size-12 rounded-2xl shrink-0"
                style={{
                  background: accent
                    ? "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary-lo))"
                    : "var(--hb-card-sunk)",
                  boxShadow: accent ? "var(--hb-shadow-glow)" : "none",
                }}
              >
                <Icon
                  className="size-5.5"
                  strokeWidth={2.25}
                  color={accent ? "#fff" : "var(--hb-primary)"}
                  aria-hidden="true"
                />
              </span>

              <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.13em] text-[var(--hb-ink-muted)]">
                {layer.sub}
              </p>
              <h3 className="mt-1.5 font-[family-name:var(--font-heading)] font-bold text-[20px] leading-tight tracking-[-0.02em]">
                {layer.title}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hb-ink-soft)] flex-1">
                {layer.body}
              </p>

              <p
                className="mt-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold self-start"
                style={{
                  background: accent
                    ? "rgba(11,110,90,0.1)"
                    : "var(--hb-card-sunk)",
                  color: accent ? "var(--hb-ok)" : "var(--hb-ink-muted)",
                }}
              >
                <span aria-hidden="true">{accent ? "✓" : "!"}</span>
                {layer.depends}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

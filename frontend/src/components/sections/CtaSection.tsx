import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-5 sm:px-8 py-8" aria-label="Get started">
      <div
        data-reveal="rise3d"
        className="relative overflow-hidden rounded-[32px] px-7 py-14 sm:px-14 sm:py-20 text-center"
        style={{
          background:
            "linear-gradient(155deg, var(--hb-primary-hi) 0%, var(--hb-primary) 42%, var(--hb-primary-lo) 100%)",
          boxShadow: "var(--hb-shadow-float)",
        }}
      >
        {/* Decorative depth: soft light pools inside the slab. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(560px 300px at 22% 0%, rgba(255,255,255,0.28), rgba(255,255,255,0) 60%)," +
              "radial-gradient(480px 320px at 84% 104%, rgba(52,211,153,0.4), rgba(52,211,153,0) 62%)",
          }}
        />

        <div className="relative">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-white text-[clamp(1.9rem,4.6vw,3.1rem)] leading-[1.05] tracking-[-0.03em] max-w-[20ch] mx-auto">
            Start with one recording.
          </h2>
          <p className="mt-5 mx-auto max-w-[54ch] text-[16.5px] leading-relaxed text-white/85">
            Upload a clip with a location and a timestamp. The first one gives
            you an identification. The tenth gives you a trend — and that is the
            part a forest department can act on.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/upload"
              className="hb-sheen inline-flex items-center justify-center gap-2 rounded-xl px-7 min-h-[52px]
                         font-semibold text-[15px] text-[var(--hb-primary-lo)] bg-white
                         transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{ transitionTimingFunction: "var(--hb-ease-out)" }}
            >
              Upload a recording
              <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link
              href="/method"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-7 min-h-[52px]
                         font-semibold text-[15px] text-white border border-white/35
                         bg-white/10 backdrop-blur
                         transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0"
              style={{ transitionTimingFunction: "var(--hb-ease-out)" }}
            >
              Read the method
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

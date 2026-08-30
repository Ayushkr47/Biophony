import Link from "next/link";
import { Waves } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer
      className="relative mt-24 border-t border-[var(--hb-border)] bg-white/60 backdrop-blur-xl"
      style={{ zIndex: 10 }}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="grid place-items-center size-8 rounded-lg"
                style={{
                  background:
                    "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary-lo))",
                }}
              >
                <Waves className="size-4" strokeWidth={2.25} color="#fff" aria-hidden="true" />
              </span>
              <span className="font-[family-name:var(--font-heading)] font-bold text-[16px]">
                Biophony
              </span>
            </div>
            <p className="mt-3 text-[14px] text-[var(--hb-ink-soft)] max-w-[34ch]">
              Passive acoustic monitoring, turned into a habitat health signal
              a forest department can actually act on.
            </p>
          </div>

          <nav aria-label="Product">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--hb-ink-muted)]">
              Product
            </h2>
            <ul className="mt-3 space-y-2 text-[14px]">
              <li><Link href="/sites" className="inline-block py-1.5 hover:text-[var(--hb-primary-lo)] transition-colors">Sites</Link></li>
              <li><Link href="/upload" className="inline-block py-1.5 hover:text-[var(--hb-primary-lo)] transition-colors">Upload</Link></li>
              <li><Link href="/method" className="inline-block py-1.5 hover:text-[var(--hb-primary-lo)] transition-colors">Method</Link></li>
            </ul>
          </nav>

          <nav aria-label="Data sources">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--hb-ink-muted)]">
              Data
            </h2>
            <ul className="mt-3 space-y-2 text-[14px]">
              <li>
                <a
                  href="https://github.com/birdnet-team/BirdNET-Analyzer"
                  className="inline-block py-1.5 hover:text-[var(--hb-primary-lo)] transition-colors"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  BirdNET-Analyzer
                </a>
              </li>
              <li>
                <a
                  href="https://www.gbif.org/"
                  className="inline-block py-1.5 hover:text-[var(--hb-primary-lo)] transition-colors"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  GBIF occurrences
                </a>
              </li>
              <li>
                <a
                  href="https://xeno-canto.org/"
                  className="inline-block py-1.5 hover:text-[var(--hb-primary-lo)] transition-colors"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Xeno-canto
                </a>
              </li>
            </ul>
          </nav>

          {/* Attribution is a licence obligation, not a footnote. */}
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--hb-ink-muted)]">
              Attribution
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--hb-ink-soft)]">
              Species identification uses{" "}
              <strong className="font-semibold text-[var(--hb-ink)]">BirdNET</strong>{" "}
              (K. Lisa Yang Center for Conservation Bioacoustics, Cornell Lab of
              Ornithology &amp; Chemnitz University of Technology). BirdNET models
              are released under{" "}
              <strong className="font-semibold text-[var(--hb-ink)]">CC BY-NC-SA 4.0</strong>
              {" "}— verify the current licence before any non-research use.
              Occurrence baselines via the GBIF API.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--hb-border)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-[13px] text-[var(--hb-ink-muted)]">
            Prototype — detections are model output and require human review.
          </p>
          <p className="text-[13px] text-[var(--hb-ink-muted)] tabular">
            Built for conservation teams · v0.1
          </p>
        </div>
      </div>
    </footer>
  );
}

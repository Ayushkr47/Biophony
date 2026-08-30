import type { Metadata } from "next";
import { Eyebrow, Notice } from "@/components/ui/Primitives";
import { Info, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Method — Biophony",
  description:
    "How recordings become a habitat health signal: BirdNET identification, GBIF range baselines, and the acoustic complexity index.",
};

const SECTIONS = [
  {
    id: "sampling",
    title: "Sampling",
    body: [
      "Each upload is treated as a sample of a site at a point in time, not a standalone identification. A site with one recording has an identification; a site with twelve has a trend, and only the trend supports a claim about habitat change.",
      "Time of day matters more than most people expect. Dawn chorus recordings are not comparable to midday ones, so the timestamp is a required field rather than optional metadata.",
    ],
  },
  {
    id: "identification",
    title: "Identification",
    body: [
      "Audio is resampled and split into 3-second windows. Each window is passed through the BirdNET TFLite model on CPU, which returns candidate species with confidence scores.",
      "Confidence is a ranking signal, not a calibrated probability. Detections arrive unreviewed and a human confirms or rejects each one; rejected detections are excluded from richness and every downstream trend.",
    ],
  },
  {
    id: "baseline",
    title: "Expected-species baseline",
    body: [
      "The site's coordinates are used to query GBIF occurrence records, producing a list of species that plausibly occur there. This is the 'expected' column in the comparison table.",
      "GBIF occurrence density varies enormously by region and by taxon. A species missing from the expected list may simply be under-recorded rather than genuinely absent, so the baseline is presented as context rather than ground truth.",
    ],
  },
  {
    id: "aci",
    title: "Acoustic complexity index",
    body: [
      "The ACI is a standard soundscape-ecology metric computed directly from the spectrogram. For each frequency bin it sums the absolute differences between adjacent time frames, normalised by the total intensity in that bin, then sums across bins.",
      "Intuitively it measures how much the soundscape varies over time. Biological sound is irregular and produces high values; constant sound — traffic, rain, machinery — produces low ones, even when it is loud.",
      "Critically, it makes no reference to species identity. When the classifier is wrong, or encounters a species it was never trained on, the ACI keeps working. That is why it carries the habitat verdict rather than the detections alone.",
    ],
  },
  {
    id: "flags",
    title: "Flags",
    body: [
      "A flag is a specific, checkable claim, not a score. Four are currently computed: an indicator species present in earlier recordings and absent from the last four; a rising share of disturbance-associated species; a decline in median ACI against the previous four recordings; and a fall in mean species richness across the sampled window.",
      "Each flag states the comparison it made and the numbers behind it, so a field officer can disagree with it on evidence.",
    ],
  },
];

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-14 sm:py-20">
      <header data-reveal="up">
        <Eyebrow>Method</Eyebrow>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] font-extrabold text-[clamp(2rem,4.8vw,3.2rem)] leading-[1.04] tracking-[-0.035em]">
          How a clip becomes a habitat signal.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[var(--hb-ink-soft)] max-w-[62ch]">
          Every number on a site dashboard should be traceable to a stated
          procedure. This page is that procedure.
        </p>
      </header>

      {/* On-page navigation — the page is long and section-structured. */}
      <nav
        data-reveal="up"
        aria-label="On this page"
        className="mt-10 hb-glass rounded-2xl p-5"
      >
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.13em] text-[var(--hb-ink-muted)]">
          On this page
        </h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-2.5 min-h-[44px] px-2 -mx-2 rounded-lg text-[14.5px]
                           hover:bg-[var(--hb-card-sunk)] hover:text-[var(--hb-primary-lo)]
                           transition-colors duration-150"
              >
                <span className="font-[family-name:var(--font-mono)] text-[12.5px] font-semibold text-[var(--hb-primary)] tabular">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {SECTIONS.map((section, i) => (
          <section key={section.id} id={section.id} data-reveal="up" className="scroll-mt-24">
            <h2 className="flex items-baseline gap-3 font-[family-name:var(--font-heading)] font-bold text-[clamp(1.4rem,3vw,1.9rem)] tracking-[-0.025em]">
              <span className="font-[family-name:var(--font-mono)] text-[15px] font-semibold text-[var(--hb-primary)] tabular shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            <div className="mt-4 space-y-4">
              {section.body.map((p, j) => (
                <p
                  key={j}
                  className="text-[16px] leading-relaxed text-[var(--hb-ink-soft)] max-w-[68ch]"
                >
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div data-reveal="up" className="mt-14 space-y-4">
        <Notice
          tone="warn"
          title="Known accuracy limitation"
          icon={<Info className="size-5" strokeWidth={2.25} />}
        >
          BirdNET is trained predominantly on North American and European
          species. Performance on Indian species is measurably weaker, and
          detections here should be treated as candidates for review rather than
          conclusions. The acoustic complexity index is reported precisely
          because it does not inherit this limitation.
        </Notice>

        <Notice
          tone="info"
          title="Attribution and licensing"
          icon={<Scale className="size-5" strokeWidth={2.25} />}
        >
          Species identification uses BirdNET, developed by the K. Lisa Yang
          Center for Conservation Bioacoustics at the Cornell Lab of Ornithology
          in partnership with Chemnitz University of Technology. BirdNET models
          are distributed under CC BY-NC-SA 4.0 — non-commercial use, with
          attribution and share-alike. Verify the current licence terms before
          any deployment beyond research or demonstration. Expected-species
          baselines come from the GBIF API; seed recordings are sourced from
          Xeno-canto under their respective contributor licences.
        </Notice>
      </div>
    </div>
  );
}

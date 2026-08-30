import type { Metadata } from "next";
import UploadFlow from "@/components/upload/UploadFlow";
import { Eyebrow } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "Upload a recording — Biophony",
  description:
    "Upload up to 60 seconds of field audio with a location and timestamp. Processing runs asynchronously with a job status endpoint.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-14 sm:py-20">
      <header data-reveal="up" className="max-w-[58ch]">
        <Eyebrow>New recording</Eyebrow>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] font-extrabold text-[clamp(2rem,4.8vw,3.1rem)] leading-[1.04] tracking-[-0.035em]">
          Add a sample to a site.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[var(--hb-ink-soft)]">
          Phone audio is fine. What matters is the location and the timestamp —
          those are what turn a clip into a data point in a trend.
        </p>
      </header>

      <div data-reveal="up" data-reveal-delay="0.1" className="mt-10">
        <UploadFlow />
      </div>
    </div>
  );
}

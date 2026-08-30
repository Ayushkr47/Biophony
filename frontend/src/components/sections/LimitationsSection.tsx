import { AlertTriangle, UserCheck, Timer, Scale } from "lucide-react";
import { Eyebrow } from "@/components/ui/Primitives";

const ITEMS = [
  {
    icon: AlertTriangle,
    title: "Geographic bias in the classifier",
    body: "BirdNET is trained predominantly on North American and European species. Accuracy on Indian species is patchier, and confidence scores should be read as a ranking, not a probability.",
    mitigation: "Every detection is reviewable, and the ACI runs independently.",
  },
  {
    icon: UserCheck,
    title: "Human-in-the-loop by default",
    body: "New detections arrive unreviewed. A field officer confirms or rejects each one, and rejected detections are excluded from richness and trend calculations.",
    mitigation: "Review state is visible on every detection row.",
  },
  {
    icon: Timer,
    title: "Sixty-second cap, processed async",
    body: "Uploads are capped at 60 seconds and queued. The job status endpoint reports progress rather than blocking the request, which keeps the app usable on a free tier.",
    mitigation: "Typical turnaround is well under a minute per clip.",
  },
  {
    icon: Scale,
    title: "Licence obligations are explicit",
    body: "BirdNET models are released under CC BY-NC-SA 4.0. Attribution is carried in the footer and on every detection view, and the current licence should be re-verified before any non-research deployment.",
    mitigation: "Non-commercial use only under the model licence.",
  },
];

export default function LimitationsSection() {
  return (
    <section
      className="relative mx-auto max-w-7xl px-5 sm:px-8 py-24"
      aria-label="Known limitations"
    >
      <div data-reveal="up" className="max-w-[62ch]">
        <Eyebrow>Stated limitations</Eyebrow>
        <h2 className="mt-4 font-[family-name:var(--font-heading)] font-bold text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.06] tracking-[-0.03em]">
          What this does not do well, said plainly.
        </h2>
        <p className="mt-5 text-[16.5px] leading-relaxed text-[var(--hb-ink-soft)]">
          An early-warning system that overstates its confidence is worse than
          no system at all. These are the constraints a user should know before
          acting on a flag.
        </p>
      </div>

      <ul data-reveal="up" data-stagger className="mt-12 grid gap-4 md:grid-cols-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="rounded-2xl p-6 bg-white/78 backdrop-blur-xl border border-white/90"
              style={{ boxShadow: "var(--hb-shadow-md)" }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="grid place-items-center size-10 rounded-xl shrink-0"
                  style={{ background: "rgba(154,84,8,0.09)" }}
                >
                  <Icon
                    className="size-5"
                    strokeWidth={2.25}
                    color="var(--hb-warn)"
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[16px] leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--hb-ink-soft)]">
                    {item.body}
                  </p>
                  <p className="mt-3 text-[13px] font-medium text-[var(--hb-primary-lo)]">
                    {item.mitigation}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

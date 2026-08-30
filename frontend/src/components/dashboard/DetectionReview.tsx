"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, RotateCcw, Undo2 } from "lucide-react";
import {
  speciesById,
  type Detection,
  type Recording,
  formatDate,
} from "@/lib/data";
import { GuildChip } from "@/components/ui/Primitives";
import Spectrogram from "@/components/ui/Spectrogram";

type Review = Detection["review"];

/**
 * Human-in-the-loop review for one recording.
 *
 * The classifier is weakest exactly where this project is deployed, so review
 * is the primary workflow rather than an afterthought. Every action is
 * undoable, and the count is announced politely to screen readers.
 */
export default function DetectionReview({ recording }: { recording: Recording }) {
  const [state, setState] = useState<Record<string, Review>>(() =>
    Object.fromEntries(recording.detections.map((d) => [d.speciesId, d.review])),
  );
  const [undo, setUndo] = useState<{ id: string; prev: Review } | null>(null);
  const timerRef = useRef<number | null>(null);

  // Reset when the caller switches recordings.
  useEffect(() => {
    setState(
      Object.fromEntries(recording.detections.map((d) => [d.speciesId, d.review])),
    );
    setUndo(null);
  }, [recording]);

  // Auto-dismiss the undo affordance; clear on unmount so it cannot leak.
  useEffect(() => {
    if (!undo) return;
    timerRef.current = window.setTimeout(() => setUndo(null), 6000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [undo]);

  const setReview = (id: string, next: Review) => {
    setUndo({ id, prev: state[id] });
    setState((s) => ({ ...s, [id]: next }));
  };

  const applyUndo = () => {
    if (!undo) return;
    setState((s) => ({ ...s, [undo.id]: undo.prev }));
    setUndo(null);
  };

  const confirmed = Object.values(state).filter((r) => r === "confirmed").length;
  const rejected = Object.values(state).filter((r) => r === "rejected").length;
  const pending = Object.values(state).filter((r) => r === "unreviewed").length;

  const sorted = [...recording.detections].sort(
    (a, b) => b.confidence - a.confidence,
  );

  return (
    <section className="hb-glass rounded-2xl p-5 sm:p-6" aria-label="Detection review">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-heading)] font-bold text-[18px] tracking-[-0.02em]">
            Review detections
          </h3>
          <p className="mt-1 text-[13.5px] text-[var(--hb-ink-muted)]">
            Latest recording · {formatDate(recording.date)} ·{" "}
            <span className="tabular">{recording.durationSec}s</span> ·{" "}
            {recording.uploader}
          </p>
        </div>

        {/* Live counts, announced as one contextual phrase rather than digits. */}
        <p
          aria-live="polite"
          className="text-[13px] tabular text-[var(--hb-ink-soft)] shrink-0"
        >
          <span className="font-semibold text-[var(--hb-ok)]">{confirmed}</span> confirmed
          {" · "}
          <span className="font-semibold text-[var(--hb-danger)]">{rejected}</span> rejected
          {" · "}
          <span className="font-semibold">{pending}</span> pending
        </p>
      </div>

      <Spectrogram className="mt-5" height={78} seed={recording.date.length * 7} bars={78} />

      <ul className="mt-5 space-y-2.5">
        {sorted.map((d) => {
          const sp = speciesById.get(d.speciesId);
          if (!sp) return null;
          const review = state[d.speciesId];

          return (
            <li
              key={d.speciesId}
              className="rounded-xl border p-3.5 transition-colors duration-200"
              style={{
                background:
                  review === "rejected"
                    ? "rgba(179,38,30,0.04)"
                    : review === "confirmed"
                      ? "rgba(11,110,90,0.04)"
                      : "rgba(255,255,255,0.6)",
                borderColor:
                  review === "rejected"
                    ? "rgba(179,38,30,0.2)"
                    : review === "confirmed"
                      ? "rgba(11,110,90,0.2)"
                      : "var(--hb-border)",
              }}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="min-w-0 flex-1 basis-[220px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className="font-semibold text-[14.5px] wrap-anywhere"
                      style={{
                        textDecoration: review === "rejected" ? "line-through" : "none",
                        color:
                          review === "rejected" ? "var(--hb-ink-muted)" : "var(--hb-ink)",
                      }}
                    >
                      {sp.common}
                    </p>
                    <GuildChip guild={sp.guild} />
                  </div>
                  <p className="text-[12.5px] italic text-[var(--hb-ink-muted)] wrap-anywhere">
                    {sp.scientific}
                  </p>
                </div>

                {/* Confidence: bar + number, never the bar alone. */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div
                    className="h-1.5 w-20 rounded-full overflow-hidden"
                    style={{ background: "var(--hb-bg-deep)" }}
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.confidence * 100}%`,
                        background:
                          d.confidence > 0.6
                            ? "linear-gradient(90deg, var(--hb-primary), var(--hb-glow))"
                            : "var(--hb-warn)",
                      }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold tabular w-9">
                    {d.confidence.toFixed(2)}
                  </span>
                  <span className="sr-only">confidence</span>
                  <span className="text-[12.5px] text-[var(--hb-ink-muted)] tabular whitespace-nowrap">
                    {d.windows} windows
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  {review === "unreviewed" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setReview(d.speciesId, "confirmed")}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 min-h-[44px] text-[13px] font-semibold
                                   text-[var(--hb-ok)] border border-[rgba(11,110,90,0.28)] bg-white
                                   transition-colors duration-150 hover:bg-[rgba(11,110,90,0.07)]"
                      >
                        <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                        Confirm
                        <span className="sr-only"> {sp.common}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReview(d.speciesId, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 min-h-[44px] text-[13px] font-semibold
                                   text-[var(--hb-danger)] border border-[rgba(179,38,30,0.28)] bg-white
                                   transition-colors duration-150 hover:bg-[rgba(179,38,30,0.07)]"
                      >
                        <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
                        Reject
                        <span className="sr-only"> {sp.common}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          color:
                            review === "confirmed" ? "var(--hb-ok)" : "var(--hb-danger)",
                          background:
                            review === "confirmed"
                              ? "rgba(11,110,90,0.1)"
                              : "rgba(179,38,30,0.1)",
                        }}
                      >
                        {review === "confirmed" ? (
                          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                        ) : (
                          <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
                        )}
                        {review === "confirmed" ? "Confirmed" : "Rejected"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReview(d.speciesId, "unreviewed")}
                        className="grid place-items-center size-11 rounded-lg text-[var(--hb-ink-muted)]
                                   hover:text-[var(--hb-primary)] hover:bg-[var(--hb-card-sunk)]
                                   transition-colors duration-150"
                        aria-label={`Reset review for ${sp.common}`}
                      >
                        <RotateCcw className="size-4" strokeWidth={2.25} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Undo lives inline rather than as a floating toast: it never covers
          the row it refers to, and it does not steal focus. */}
      {undo && (
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          style={{ background: "var(--hb-card-sunk)" }}
        >
          <p className="text-[13.5px] text-[var(--hb-ink-soft)]">
            Review updated for{" "}
            <strong className="font-semibold text-[var(--hb-ink)]">
              {speciesById.get(undo.id)?.common}
            </strong>
            .
          </p>
          <button
            type="button"
            onClick={applyUndo}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 min-h-[44px] text-[13px] font-semibold
                       text-[var(--hb-primary-lo)] hover:bg-white transition-colors duration-150 shrink-0"
          >
            <Undo2 className="size-4" strokeWidth={2.25} aria-hidden="true" />
            Undo
          </button>
        </div>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-[var(--hb-ink-muted)]">
        Identification by BirdNET (Cornell Lab of Ornithology / Chemnitz
        University of Technology), models under CC BY-NC-SA 4.0. Rejected
        detections are excluded from richness and trend calculations.
      </p>
    </section>
  );
}

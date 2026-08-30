"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Per-word, per-character entrance for a short headline.
 *
 * The whole heading carries its text in aria-label and every fragment is
 * aria-hidden, so assistive tech reads one clean string rather than a stream
 * of single letters. Reserve for headlines under ~10 words: one DOM node per
 * character is expensive and pointless on body copy.
 */
export default function SplitHeadline({
  text,
  className = "",
  as: Tag = "h1",
  delay = 0,
  /** Words rendered in the accent colour. */
  accentWords = [],
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p";
  delay?: number;
  accentWords?: string[];
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const chars = root.querySelectorAll<HTMLElement>("[data-char]");
      gsap.set(chars, { opacity: 0, yPercent: 108, rotateX: -78 });

      const tl = gsap.to(chars, {
        opacity: 1,
        yPercent: 0,
        rotateX: 0,
        duration: 0.72,
        stagger: 0.014,
        ease: "expo.out",
        delay,
        onComplete: () => gsap.set(chars, { clearProps: "transform,willChange" }),
      });

      /* rAF is suspended in a background tab, which would leave the headline
         invisible until the tab is focused. Timers still run, so snap to the
         final frame if the tween never got going. */
      const failsafe = window.setTimeout(() => {
        if (tl.progress() === 0) tl.progress(1);
      }, 2600);

      return () => {
        window.clearTimeout(failsafe);
        tl.kill();
      };
    });

    return () => mm.revert();
  }, [text, delay]);

  const words = text.split(" ");
  const accent = new Set(accentWords.map((w) => w.toLowerCase()));

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      aria-label={text}
      style={{ perspective: "700px" }}
    >
      {words.map((word, wi) => {
        const isAccent = accent.has(word.toLowerCase().replace(/[^a-z]/g, ""));
        return (
          /* Word gaps come from an explicit margin, not a whitespace text node
             — inline-block siblings collapse the space between them. */
          <span
            key={`${word}-${wi}`}
            aria-hidden="true"
            className="inline-block whitespace-nowrap"
            style={{
              marginRight: wi < words.length - 1 ? "0.26em" : undefined,
              color: isAccent ? "var(--hb-primary)" : undefined,
            }}
          >
            <span
              className="inline-block overflow-hidden align-bottom"
              /* Extra room below the baseline so descenders are not clipped
                 by the mask, pulled back so line height is unaffected. */
              style={{ paddingBottom: "0.16em", marginBottom: "-0.16em" }}
            >
              {Array.from(word).map((ch, ci) => (
                <span
                  key={ci}
                  data-char
                  className="inline-block"
                  style={{ transformOrigin: "50% 100%", willChange: "transform, opacity" }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

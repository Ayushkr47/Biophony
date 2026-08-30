"use client";

import { useEffect, useRef } from "react";
import { viewportState } from "@/lib/viewport-store";

/** Thin scroll indicator. Decorative — the real position cue is the content. */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = -1;

    const loop = () => {
      const el = barRef.current;
      if (el && viewportState.visible) {
        const p = viewportState.scroll;
        // Only touch the DOM when the value actually moved.
        if (Math.abs(p - last) > 0.001) {
          el.style.transform = `scaleX(${p})`;
          last = p;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px]"
      style={{ zIndex: 60 }}
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left"
        style={{
          transform: "scaleX(0)",
          background:
            "linear-gradient(90deg, var(--hb-primary) 0%, var(--hb-glow) 55%, var(--hb-secondary) 100%)",
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { startViewportTracking } from "@/lib/viewport-store";

/* WebGL cannot render on the server, and we do not want three.js in the
   initial bundle — the page must be readable before the scene arrives. */
const HabitatScene = dynamic(() => import("./HabitatScene"), { ssr: false });

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export default function HabitatCanvas() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stop = startViewportTracking();

    // Let first paint and fonts settle before spinning up WebGL.
    const id = window.setTimeout(() => {
      if (supportsWebGL()) setEnabled(true);
    }, 260);

    return () => {
      window.clearTimeout(id);
      stop();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Painted gradient floor. Always present, so the page never looks
          broken while WebGL boots or if it is unavailable entirely. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 18% -8%, #ffffff 0%, rgba(255,255,255,0) 62%)," +
            "radial-gradient(900px 620px at 88% 4%, #e0f5ea 0%, rgba(224,245,234,0) 66%)," +
            "radial-gradient(1000px 800px at 50% 108%, #ddf0f5 0%, rgba(221,240,245,0) 62%)," +
            "linear-gradient(180deg, #f6fbf8 0%, #eef8f3 48%, #f6fbf8 100%)",
        }}
      />

      {enabled ? (
        <div
          className="absolute inset-0"
          style={{
            opacity: 1,
            transition: "opacity 900ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <HabitatScene />
        </div>
      ) : null}

      {/* Readability veil. The field is decorative and must never cost body
          copy its contrast, so it sits behind a light wash that is heaviest
          across the middle band where most text lands. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(246,251,248,0.34) 0%, rgba(246,251,248,0.46) 45%, rgba(246,251,248,0.34) 100%)",
        }}
      />

      {/* Top and bottom vignettes keep text contrast stable over the field. */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "linear-gradient(180deg, rgba(246,251,248,0.92) 0%, rgba(246,251,248,0) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-52"
        style={{
          background:
            "linear-gradient(0deg, rgba(246,251,248,0.9) 0%, rgba(246,251,248,0) 100%)",
        }}
      />
    </div>
  );
}

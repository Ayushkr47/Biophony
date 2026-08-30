"use client";

import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. Keep modest — this is a surface, not a toy. */
  max?: number;
  /** Lift in px on hover. */
  lift?: number;
  glare?: boolean;
  style?: React.CSSProperties;
};

/**
 * Pointer-tracked 3D tilt.
 *
 * Writes transforms directly to the node inside rAF rather than through React
 * state, so hovering never triggers a re-render. Disabled entirely for coarse
 * pointers and reduced-motion users — on touch it would fight the scroll
 * gesture and never fire anyway.
 */
export default function TiltCard({
  children,
  className = "",
  max = 8,
  lift = 10,
  glare = true,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const target = useRef({ rx: 0, ry: 0, lz: 0, gx: 50, gy: 50, on: 0 });
  const current = useRef({ rx: 0, ry: 0, lz: 0, gx: 50, gy: 50, on: 0 });

  const canTilt = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loop = () => {
    const el = ref.current;
    if (!el) return;
    const c = current.current;
    const t = target.current;

    c.rx += (t.rx - c.rx) * 0.14;
    c.ry += (t.ry - c.ry) * 0.14;
    c.lz += (t.lz - c.lz) * 0.14;
    c.gx += (t.gx - c.gx) * 0.14;
    c.gy += (t.gy - c.gy) * 0.14;
    c.on += (t.on - c.on) * 0.14;

    el.style.transform = `perspective(1000px) rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg) translate3d(0,${(-c.lz).toFixed(2)}px,0)`;

    if (glareRef.current) {
      glareRef.current.style.opacity = (c.on * 0.5).toFixed(3);
      glareRef.current.style.background = `radial-gradient(420px circle at ${c.gx.toFixed(1)}% ${c.gy.toFixed(1)}%, rgba(255,255,255,0.95), rgba(255,255,255,0) 62%)`;
    }

    const settled =
      Math.abs(t.rx - c.rx) < 0.01 &&
      Math.abs(t.ry - c.ry) < 0.01 &&
      Math.abs(t.on - c.on) < 0.01;

    if (settled) {
      raf.current = 0;
      // Release the compositor layer once motion stops.
      el.style.willChange = "auto";
      return;
    }
    raf.current = requestAnimationFrame(loop);
  };

  const kick = () => {
    if (raf.current) return;
    if (ref.current) ref.current.style.willChange = "transform";
    raf.current = requestAnimationFrame(loop);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !canTilt()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    target.current.ry = (px - 0.5) * max * 2;
    target.current.rx = -(py - 0.5) * max * 2;
    target.current.lz = lift;
    target.current.gx = px * 100;
    target.current.gy = py * 100;
    target.current.on = 1;
    kick();
  };

  const onLeave = () => {
    target.current = { rx: 0, ry: 0, lz: 0, gx: 50, gy: 50, on: 0 };
    kick();
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative ${className}`}
      style={{ transformStyle: "preserve-3d", ...style }}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light"
          style={{ opacity: 0 }}
        />
      )}
    </div>
  );
}

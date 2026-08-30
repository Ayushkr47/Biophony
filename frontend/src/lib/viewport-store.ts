"use client";

/**
 * A single rAF-throttled source of truth for pointer position and scroll
 * progress, shared by the WebGL background and any DOM parallax layers.
 *
 * Deliberately NOT React state: these values change every frame, and routing
 * them through re-renders would blow the 16ms frame budget. Consumers read
 * `viewportState` directly inside their own animation loop.
 */

export type ViewportState = {
  /** Pointer in normalised device coords, -1..1. Smoothed. */
  pointerX: number;
  pointerY: number;
  /** Raw (unsmoothed) pointer target, -1..1. */
  targetX: number;
  targetY: number;
  /** Whole-document scroll progress, 0..1. */
  scroll: number;
  /** Smoothed scroll progress, 0..1. */
  scrollSmooth: number;
  /** Instantaneous scroll velocity in px/frame, clamped to -1..1. */
  velocity: number;
  /** Scroll offset in px. */
  scrollY: number;
  /** True while the pointer is a real mouse (not touch) and inside the page. */
  pointerActive: boolean;
  /** True when the document is visible. Consumers should idle when false. */
  visible: boolean;
  /** True when the user asked for reduced motion. */
  reducedMotion: boolean;
};

export const viewportState: ViewportState = {
  pointerX: 0,
  pointerY: 0,
  targetX: 0,
  targetY: 0,
  scroll: 0,
  scrollSmooth: 0,
  velocity: 0,
  scrollY: 0,
  pointerActive: false,
  visible: true,
  reducedMotion: false,
};

let started = false;
let rafId = 0;
let lastScrollY = 0;

function readReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function onPointerMove(e: PointerEvent) {
  if (e.pointerType === "touch") return;
  viewportState.targetX = (e.clientX / window.innerWidth) * 2 - 1;
  viewportState.targetY = -((e.clientY / window.innerHeight) * 2 - 1);
  viewportState.pointerActive = true;
}

function onPointerLeave() {
  viewportState.pointerActive = false;
  viewportState.targetX = 0;
  viewportState.targetY = 0;
}

function onVisibility() {
  viewportState.visible = document.visibilityState === "visible";
}

function tick() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const y = window.scrollY || doc.scrollTop || 0;

  viewportState.scrollY = y;
  viewportState.scroll = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

  // Velocity, normalised and clamped so a fling does not spike the scene.
  const dy = y - lastScrollY;
  lastScrollY = y;
  viewportState.velocity += (Math.max(-1, Math.min(1, dy / 60)) - viewportState.velocity) * 0.15;

  // Critically-damped-ish smoothing. Lower factor = more lag = more "weight".
  viewportState.scrollSmooth += (viewportState.scroll - viewportState.scrollSmooth) * 0.08;
  viewportState.pointerX += (viewportState.targetX - viewportState.pointerX) * 0.05;
  viewportState.pointerY += (viewportState.targetY - viewportState.pointerY) * 0.05;

  rafId = requestAnimationFrame(tick);
}

/** Idempotent. Returns a teardown function. */
export function startViewportTracking(): () => void {
  if (typeof window === "undefined") return () => {};
  if (started) return () => {};
  started = true;

  viewportState.reducedMotion = readReducedMotion();
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMq = () => {
    viewportState.reducedMotion = mq.matches;
  };
  mq.addEventListener("change", onMq);

  lastScrollY = window.scrollY;
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  rafId = requestAnimationFrame(tick);

  return () => {
    started = false;
    cancelAnimationFrame(rafId);
    mq.removeEventListener("change", onMq);
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** Coarse device-capability probe used to scale particle counts down. */
export function getPerfTier(): "low" | "mid" | "high" {
  if (typeof window === "undefined") return "mid";
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;

  if (narrow || coarse || mem <= 2 || cores <= 2) return "low";
  if (mem <= 4 || cores <= 4) return "mid";
  return "high";
}

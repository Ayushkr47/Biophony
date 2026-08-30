"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { viewportState, getPerfTier } from "@/lib/viewport-store";
import {
  TERRAIN_VERT,
  TERRAIN_FRAG,
  MOTE_VERT,
  MOTE_FRAG,
} from "./shaders";

/* Palette mirrors the CSS tokens so canvas and DOM never drift apart. */
const C_LOW = new THREE.Color("#a8d2c2");
const C_HIGH = new THREE.Color("#0b6e5a");
const C_RIPPLE = new THREE.Color("#34d399");
const C_MOTE_A = new THREE.Color("#0e7490");
const C_MOTE_B = new THREE.Color("#0b6e5a");

const HALF = 22;

type Tier = "low" | "mid" | "high";

const GRID_FOR: Record<Tier, number> = { low: 96, mid: 150, high: 208 };
const MOTES_FOR: Record<Tier, number> = { low: 40, mid: 90, high: 150 };

/* ------------------------------------------------------------------ */
/* Terrain                                                             */
/* ------------------------------------------------------------------ */

function SoundTerrain({ tier }: { tier: Tier }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const n = GRID_FOR[tier];
    const count = n * n;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    let i = 0;
    for (let ix = 0; ix < n; ix++) {
      for (let iz = 0; iz < n; iz++) {
        const x = (ix / (n - 1) - 0.5) * HALF * 2;
        const z = (iz / (n - 1) - 0.5) * HALF * 2;
        positions[i * 3] = x;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = z;
        seeds[i] = Math.random();
        i++;
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    // Points never need frustum-culled bounds recomputed per frame.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), HALF * 1.6);
    return g;
  }, [tier]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uVelocity: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerAmt: { value: 0 },
      uAmp: { value: 1.35 },
      uSize: { value: tier === "low" ? 3.0 : 2.1 },
      uHalf: { value: HALF },
      uColorLow: { value: C_LOW },
      uColorHigh: { value: C_HIGH },
      uColorRipple: { value: C_RIPPLE },
      uOpacity: { value: 0.0 },
    }),
    [tier],
  );

  useFrame((_, delta) => {
    const m = matRef.current;
    if (!m) return;
    const u = m.uniforms;

    // Reduced motion: hold a single readable frame, no time advance.
    if (!viewportState.reducedMotion) {
      u.uTime.value += Math.min(delta, 0.05);
    }

    u.uScroll.value = viewportState.scrollSmooth;
    u.uVelocity.value = viewportState.velocity;
    (u.uPointer.value as THREE.Vector2).set(
      viewportState.pointerX,
      viewportState.pointerY,
    );

    const wantPointer = viewportState.pointerActive && !viewportState.reducedMotion ? 1 : 0;
    u.uPointerAmt.value += (wantPointer - u.uPointerAmt.value) * 0.06;

    // Fade in on first frames rather than popping into view.
    u.uOpacity.value += (0.42 - u.uOpacity.value) * 0.04;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={TERRAIN_VERT}
        fragmentShader={TERRAIN_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Motes                                                               */
/* ------------------------------------------------------------------ */

function DetectionMotes({ tier }: { tier: Tier }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const count = MOTES_FOR[tier];
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 9 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 36;
      seeds[i] = Math.random();
      scales[i] = 0.5 + Math.random() * 1.4;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    return g;
  }, [tier]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerAmt: { value: 0 },
      uSize: { value: 5.5 },
      uColorA: { value: C_MOTE_A },
      uColorB: { value: C_MOTE_B },
      uOpacity: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    const m = matRef.current;
    if (!m) return;
    const u = m.uniforms;

    if (!viewportState.reducedMotion) {
      u.uTime.value += Math.min(delta, 0.05);
    }
    u.uScroll.value = viewportState.scrollSmooth;
    (u.uPointer.value as THREE.Vector2).set(
      viewportState.pointerX,
      viewportState.pointerY,
    );
    const wantPointer = viewportState.pointerActive && !viewportState.reducedMotion ? 1 : 0;
    u.uPointerAmt.value += (wantPointer - u.uPointerAmt.value) * 0.05;
    u.uOpacity.value += (0.32 - u.uOpacity.value) * 0.03;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={MOTE_VERT}
        fragmentShader={MOTE_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Camera rig — scroll dollies, pointer parallaxes                     */
/* ------------------------------------------------------------------ */

function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.6, -6));

  useFrame(() => {
    const s = viewportState.scrollSmooth;
    const px = viewportState.pointerX;
    const py = viewportState.pointerY;

    // Rise and pitch over the terrain as the page advances.
    const targetY = 3.4 + s * 3.2 + py * 0.7;
    const targetX = px * 2.4;
    const targetZ = 13.5 - s * 4.5;

    camera.position.x += (targetX - camera.position.x) * 0.045;
    camera.position.y += (targetY - camera.position.y) * 0.045;
    camera.position.z += (targetZ - camera.position.z) * 0.045;

    look.current.x += (px * 1.1 - look.current.x) * 0.04;
    look.current.y += (0.4 - s * 1.4 - look.current.y) * 0.04;
    camera.lookAt(look.current);
  });

  return null;
}

/* Pauses the render loop whenever the tab is hidden. */
function VisibilityGate() {
  const { invalidate } = useThree();
  useFrame(() => {
    if (viewportState.visible) invalidate();
  });
  return null;
}

/* ------------------------------------------------------------------ */

export default function HabitatScene() {
  const tier = useMemo<Tier>(() => getPerfTier(), []);
  const dpr = useMemo<[number, number]>(
    () => (tier === "low" ? [1, 1.4] : [1, 1.8]),
    [tier],
  );

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 3.4, 13.5], fov: 52, near: 0.1, far: 90 }}
      style={{ pointerEvents: "none" }}
      // Scene is decorative; never steal pointer events from the page.
      eventSource={undefined}
      eventPrefix="client"
    >
      <fog attach="fog" args={["#f6fbf8", 20, 58]} />
      <SoundTerrain tier={tier} />
      <DetectionMotes tier={tier} />
      <CameraRig />
      <VisibilityGate />
    </Canvas>
  );
}

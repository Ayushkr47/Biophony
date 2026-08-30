/**
 * Shaders for the interactive habitat background.
 *
 * The field is a point-cloud "soundscape terrain": a grid whose height is
 * driven by layered simplex noise, so it reads as a living landscape rather
 * than a decorative blob. Pointer position injects a travelling ripple —
 * the same way a detection propagates through a recording — and scroll
 * progress advances the terrain and lifts its amplitude.
 */

/* Classic 3D simplex noise — Ashima Arts / Stefan Gustavson (MIT). */
export const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const TERRAIN_VERT = /* glsl */ `
${SIMPLEX_3D}

uniform float uTime;
uniform float uScroll;       // 0..1 smoothed page progress
uniform float uVelocity;     // -1..1 scroll velocity
uniform vec2  uPointer;      // -1..1
uniform float uPointerAmt;   // 0..1 pointer influence (0 on touch)
uniform float uAmp;
uniform float uSize;
uniform float uHalf;         // half-extent of the grid in world units

attribute float aSeed;

varying float vHeight;
varying float vRipple;
varying float vFade;
varying float vSeed;

/* Two octaves is plenty: this is background texture, not a heightmap. */
float fbm(vec2 p, float t) {
  float n  = snoise(vec3(p * 0.16, t * 0.09)) * 1.00;
  n       += snoise(vec3(p * 0.41, t * 0.14)) * 0.42;
  n       += snoise(vec3(p * 0.93, t * 0.20)) * 0.16;
  return n;
}

void main() {
  vec3 pos = position;

  /* Terrain drifts toward the viewer as the page scrolls, so the whole
     landscape reads as travelling with you rather than merely wobbling. */
  float drift = uTime * 0.22 + uScroll * 26.0;
  vec2 samplePos = vec2(pos.x, pos.z + drift);

  float h = fbm(samplePos, uTime);

  /* Amplitude swells slightly through the page, then settles. */
  float ampCurve = uAmp * (0.72 + uScroll * 0.55);
  h *= ampCurve;

  /* Pointer ripple: a travelling wave centred on the cursor, in world XZ. */
  vec2 pointerWorld = vec2(uPointer.x * uHalf * 0.85, -uPointer.y * uHalf * 0.5);
  float d = distance(pos.xz, pointerWorld);
  float wave = sin(d * 1.5 - uTime * 2.6) * exp(-d * 0.22);
  float ripple = wave * uPointerAmt;
  h += ripple * 0.9;

  /* Scroll velocity gives the field a subtle inertial shear. */
  pos.x += uVelocity * 0.35 * sin(pos.z * 0.2 + uTime * 0.5);

  pos.y = h;

  vHeight = h;
  vRipple = abs(ripple);
  vSeed = aSeed;

  /* Fade toward the far edge so the grid dissolves instead of ending. */
  float distFromCentre = length(pos.xz) / uHalf;
  vFade = 1.0 - smoothstep(0.42, 1.0, distFromCentre);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  /* Perspective size attenuation, with a gentle per-point twinkle. */
  float twinkle = 0.78 + 0.22 * sin(uTime * 1.6 + aSeed * 44.0);
  gl_PointSize = uSize * twinkle * (14.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const TERRAIN_FRAG = /* glsl */ `
precision highp float;

uniform vec3  uColorLow;
uniform vec3  uColorHigh;
uniform vec3  uColorRipple;
uniform float uOpacity;

varying float vHeight;
varying float vRipple;
varying float vFade;
varying float vSeed;

void main() {
  /* Round, soft-edged points. Discarding early is cheaper than blending. */
  vec2 uv = gl_PointCoord - 0.5;
  float r = dot(uv, uv);
  if (r > 0.25) discard;
  float alpha = smoothstep(0.25, 0.02, r);

  float t = clamp(vHeight * 0.55 + 0.5, 0.0, 1.0);
  vec3 col = mix(uColorLow, uColorHigh, t);

  /* Ripple crests pick up the accent colour - motion you can see, not just feel. */
  col = mix(col, uColorRipple, clamp(vRipple * 1.6, 0.0, 0.85));

  gl_FragColor = vec4(col, alpha * uOpacity * vFade);
}
`;

/* ---------------------------------------------------------------------- */
/* Floating detection motes: sparse, slow, and drawn above the terrain.    */
/* ---------------------------------------------------------------------- */

export const MOTE_VERT = /* glsl */ `
${SIMPLEX_3D}

uniform float uTime;
uniform float uScroll;
uniform vec2  uPointer;
uniform float uPointerAmt;
uniform float uSize;

attribute float aSeed;
attribute float aScale;

varying float vSeed;
varying float vGlow;

void main() {
  vec3 pos = position;

  float t = uTime * 0.14 + aSeed * 10.0;
  pos.x += snoise(vec3(aSeed * 3.1, t, 0.0)) * 1.5;
  pos.y += snoise(vec3(0.0, t, aSeed * 5.7)) * 1.1 + sin(t * 1.7) * 0.25;
  pos.z += snoise(vec3(t, aSeed * 2.3, 0.0)) * 1.5;

  /* Motes drift down-page as you scroll, reinforcing travel direction. */
  pos.z += uScroll * 14.0;
  pos.z = mod(pos.z + 18.0, 36.0) - 18.0;

  /* Gentle attraction toward the cursor - the field notices you. */
  vec2 target = vec2(uPointer.x * 9.0, uPointer.y * 4.0 + 2.5);
  pos.xy += (target - pos.xy) * 0.06 * uPointerAmt;

  vGlow = 0.55 + 0.45 * sin(uTime * 2.0 + aSeed * 30.0);
  vSeed = aSeed;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * aScale * (18.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const MOTE_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;

varying float vSeed;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;

  /* Soft core + halo, so motes read as luminous on a light background. */
  float core = smoothstep(0.5, 0.06, r);
  float halo = smoothstep(0.5, 0.24, r) * 0.35;

  vec3 col = mix(uColorA, uColorB, fract(vSeed * 7.3));
  gl_FragColor = vec4(col, (core * 0.85 + halo) * uOpacity * vGlow);
}
`;

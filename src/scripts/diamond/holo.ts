import * as THREE from 'three'

// Holographic / liquid iridescent surface: soft wavy ridges whose colour
// cycles through blue, purple, gold and green over time, plus a fresnel rim.

// Shared GLSL: the iridescent pattern itself, reused by the DOM-synced holo
// surfaces (src/scripts/holo) so that everything shares the same colours.
// holoPattern() returns the base surface colour and writes the current
// rainbow hue into `rainbow` for rims and highlights.
export const HOLO_GLSL = /* glsl */ `
  float holoWave(vec2 p, float t) {
    return sin(p.x * 4.0 + t * 0.6) * cos(p.y * 3.0 - t * 0.4) + sin(p.x * 7.0 - t * 0.9) * 0.5;
  }

  vec3 holoPattern(vec2 p, float t, out vec3 rainbow) {
    float ridge = holoWave(p, t) + holoWave(p * 1.7 + 10.0, t * 1.3) * 0.6;

    vec3 colBlue   = vec3(0.25, 0.65, 1.0);
    vec3 colPurple = vec3(0.7, 0.35, 1.0);
    vec3 colGold   = vec3(1.0, 0.8, 0.35);
    vec3 colGreen  = vec3(0.3, 1.0, 0.65);
    vec3 colDark   = vec3(0.12, 0.12, 0.16);

    float phase = fract(ridge * 0.25 + t * 0.05);
    if (phase < 0.25) rainbow = mix(colBlue, colPurple, phase * 4.0);
    else if (phase < 0.5) rainbow = mix(colPurple, colGold, (phase - 0.25) * 4.0);
    else if (phase < 0.75) rainbow = mix(colGold, colGreen, (phase - 0.5) * 4.0);
    else rainbow = mix(colGreen, colBlue, (phase - 0.75) * 4.0);

    vec3 col = mix(colDark, rainbow, smoothstep(-0.3, 1.0, ridge));
    return col + rainbow * 0.15;
  }
`

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vFlat;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vFlat = normal.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uQuarter;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vFlat;

  ${HOLO_GLSL}

  void main() {
    // Top/bottom faces: when the slab's quarter turn snaps back to 0°, turn
    // their UVs by the same quarter so the pattern doesn't jump.
    // Top and bottom UVs are mirrored, so the quarter goes opposite ways.
    vec2 uv = vUv;
    if (uQuarter > 0.5 && vFlat > 0.5) uv = vec2(vUv.y, 1.0 - vUv.x);
    if (uQuarter > 0.5 && vFlat < -0.5) uv = vec2(1.0 - vUv.y, vUv.x);

    vec3 rainbow;
    vec3 col = holoPattern(uv * 3.0, uTime, rainbow);

    // Fresnel: edges seen at a grazing angle light up more.
    float fres = pow(1.0 - abs(vNormal.z), 2.0);
    col += rainbow * fres * 0.7;

    gl_FragColor = vec4(col, uOpacity);
  }
`

export function createHoloMaterial() {
  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 1 }, uQuarter: { value: 0 } }
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  })
  return { material, uniforms }
}

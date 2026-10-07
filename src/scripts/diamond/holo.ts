import * as THREE from 'three'

// Holographic / liquid iridescent surface: soft wavy ridges whose colour
// cycles through blue, purple, gold and green over time, plus a fresnel rim.

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec2 vUv;

  float wave(vec2 p, float t) {
    return sin(p.x * 4.0 + t * 0.6) * cos(p.y * 3.0 - t * 0.4) + sin(p.x * 7.0 - t * 0.9) * 0.5;
  }

  void main() {
    vec2 p = vUv * 3.0;
    float ridge = wave(p, uTime) + wave(p * 1.7 + 10.0, uTime * 1.3) * 0.6;

    vec3 colBlue   = vec3(0.25, 0.65, 1.0);
    vec3 colPurple = vec3(0.7, 0.35, 1.0);
    vec3 colGold   = vec3(1.0, 0.8, 0.35);
    vec3 colGreen  = vec3(0.3, 1.0, 0.65);
    vec3 colDark   = vec3(0.12, 0.12, 0.16);

    float phase = fract(ridge * 0.25 + uTime * 0.05);
    vec3 rainbow;
    if (phase < 0.25) rainbow = mix(colBlue, colPurple, phase * 4.0);
    else if (phase < 0.5) rainbow = mix(colPurple, colGold, (phase - 0.25) * 4.0);
    else if (phase < 0.75) rainbow = mix(colGold, colGreen, (phase - 0.5) * 4.0);
    else rainbow = mix(colGreen, colBlue, (phase - 0.75) * 4.0);

    vec3 col = mix(colDark, rainbow, smoothstep(-0.3, 1.0, ridge));
    col += rainbow * 0.15;

    float fres = pow(1.0 - abs(vNormal.z), 2.0);
    col += rainbow * fres * 0.7;

    gl_FragColor = vec4(col, uOpacity);
  }
`

export function createHoloMaterial() {
  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 1 } }
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  })
  return { material, uniforms }
}

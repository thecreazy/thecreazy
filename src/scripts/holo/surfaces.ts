import * as THREE from 'three'
import type { StageState } from '../stage/state'
import { HOLO_GLSL } from '../diamond/holo'
import { holoState, TILT_PERSPECTIVE } from './registry'
import { canvasPixelRatio } from '../stage/pixelRatio'

// Holographic surfaces drawn under DOM elements marked [data-holo], on a
// canvas that sits between the background and the content. Each surface is
// a quad placed in CSS pixels on the element's box and tilted with the same
// perspective transform as its [data-holo-face], so DOM and WebGL move as one.
// [data-holo-text] elements are filled with the pattern through a mask of
// their own lines of text ([data-holo-line]).

THREE.ColorManagement.enabled = false

const vertexShader = /* glsl */ `
  uniform vec2 uView;
  uniform vec2 uCenter;
  uniform vec2 uSize;
  uniform mat4 uTilt;
  uniform float uPersp;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    // CSS space: x right, y down, origin at the element centre.
    vec4 p = uTilt * vec4(position.x * uSize.x, -position.y * uSize.y, 0.0, 1.0);
    float s = uPersp / (uPersp - p.z);
    vec2 screen = uCenter + p.xy * s;
    vec2 ndc = vec2(screen.x / uView.x * 2.0 - 1.0, 1.0 - screen.y / uView.y * 2.0);
    // w = 1/s keeps the pattern perspective-correct across the tilted quad.
    float w = 1.0 / s;
    gl_Position = vec4(ndc * w, 0.0, w);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uActive;
  uniform float uOpacity;
  uniform float uText;
  uniform vec2 uSize;
  uniform vec2 uPointer;
  uniform sampler2D uMask;
  varying vec2 vUv;

  ${HOLO_GLSL}

  void main() {
    vec2 aspect = vec2(uSize.x / uSize.y, 1.0);
    // uv is bottom-up, the pointer top-down.
    vec2 pointer = vec2(uPointer.x, 1.0 - uPointer.y);

    vec3 rainbow;
    vec3 holo = holoPattern(vUv * aspect * 1.6 + pointer * 0.6, uTime, rainbow);

    vec2 toPointer = (vUv - pointer) * aspect;
    float sheen = exp(-dot(toPointer, toPointer) * 5.0);

    if (uText > 0.5) {
      float a = texture2D(uMask, vUv).a;
      gl_FragColor = vec4(holo * 1.15 + rainbow * sheen * 0.35, a * uOpacity);
      return;
    }

    // Distance from the nearest edge, in px: thin iridescent rim + inner glow.
    vec2 px = vUv * uSize;
    float edge = min(min(px.x, uSize.x - px.x), min(px.y, uSize.y - px.y));
    float rim = 1.0 - smoothstep(0.0, 1.5, edge);
    float glow = exp(-edge / 22.0);

    vec3 base = vec3(0.06, 0.06, 0.08);
    vec3 col = mix(base, holo * 0.48, uActive);
    col += rainbow * (rim * 0.9 + glow * (0.18 + 0.3 * uActive));
    col += rainbow * sheen * 0.25 * uActive;

    gl_FragColor = vec4(col, uOpacity);
  }
`

interface Surface {
  el: HTMLElement
  mesh: THREE.Mesh
  uniforms: Record<string, THREE.IUniform>
  mask?: THREE.CanvasTexture
}

// Redraw an element's text lines into an alpha mask matching its box.
function drawMask(el: HTMLElement, texture: THREE.CanvasTexture) {
  const canvas = texture.image as HTMLCanvasElement
  const box = el.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio, 2)
  canvas.width = Math.max(1, Math.round(box.width * dpr))
  canvas.height = Math.max(1, Math.round(box.height * dpr))
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#fff'

  el.querySelectorAll<HTMLElement>('[data-holo-line]').forEach((line) => {
    const r = line.getBoundingClientRect()
    const cs = getComputedStyle(line)
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const text = line.textContent ?? ''
    const m = ctx.measureText(text)
    // Same vertical placement as the CSS line box (content area centred).
    const ascent = m.fontBoundingBoxAscent
    const descent = m.fontBoundingBoxDescent
    const baseline = r.top - box.top + (r.height - (ascent + descent)) / 2 + ascent
    ctx.fillText(text, r.left - box.left, baseline)
  })
  texture.needsUpdate = true
}

export async function createHoloSurfaces(canvas: HTMLCanvasElement, { reducedMotion = false }) {
  await document.fonts.ready

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(canvasPixelRatio())

  const scene = new THREE.Scene()
  const camera = new THREE.Camera() // unused: the vertex shader works in CSS px
  const plane = new THREE.PlaneGeometry(1, 1)
  const view = new THREE.Vector2(1, 1)
  const tilt = new THREE.Matrix4()
  let opacity = 0

  const surfaces: Surface[] = [...document.querySelectorAll<HTMLElement>('[data-holo]')].map(
    (el) => {
      const isText = el.hasAttribute('data-holo-text')
      const mask = isText ? new THREE.CanvasTexture(document.createElement('canvas')) : undefined
      const uniforms: Record<string, THREE.IUniform> = {
        uView: { value: view },
        uCenter: { value: new THREE.Vector2() },
        uSize: { value: new THREE.Vector2(1, 1) },
        uTilt: { value: new THREE.Matrix4() },
        uPersp: { value: TILT_PERSPECTIVE },
        uTime: { value: 0 },
        uActive: { value: 0 },
        uOpacity: { value: 0 },
        uText: { value: isText ? 1 : 0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uMask: { value: mask ?? null },
      }
      const mesh = new THREE.Mesh(
        plane,
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        })
      )
      mesh.frustumCulled = false
      scene.add(mesh)
      return { el, mesh, uniforms, mask }
    }
  )

  function fit() {
    view.set(window.innerWidth, window.innerHeight)
    renderer.setSize(view.x, view.y, false)
    surfaces.forEach((s) => s.mask && drawMask(s.el, s.mask))
  }
  window.addEventListener('resize', fit)
  fit()

  const clock = new THREE.Clock()
  let drawn = false

  function frame() {
    requestAnimationFrame(frame)
    // Nothing to draw on the pastel intro: skip the per-surface layout reads.
    if (opacity <= 0.001 && !drawn) return
    const t = reducedMotion ? 2 : clock.getElapsedTime()

    let any = false
    for (const s of surfaces) {
      const r = s.el.getBoundingClientRect()
      const visible =
        opacity > 0.001 && r.right > 0 && r.left < view.x && r.bottom > 0 && r.top < view.y
      s.mesh.visible = visible
      if (!visible) continue
      any = true

      const state = holoState(s.el)
      const u = s.uniforms
      u.uCenter.value.set(r.left + r.width / 2, r.top + r.height / 2)
      u.uSize.value.set(r.width, r.height)
      const m = new DOMMatrix().rotateSelf(state.tiltX, 0, 0).rotateSelf(0, state.tiltY, 0)
      ;(u.uTilt.value as THREE.Matrix4).copy(tilt.fromArray(m.toFloat32Array()))
      u.uActive.value = state.active
      u.uPointer.value.set(state.pointerX, state.pointerY)
      u.uTime.value = t
      u.uOpacity.value = opacity
    }

    if (any) {
      renderer.render(scene, camera)
      drawn = true
    } else if (drawn) {
      renderer.clear()
      drawn = false
    }
  }
  frame()

  return {
    // Surfaces only exist on the night background.
    update(state: StageState) {
      opacity = 1 - state.intro
    },
    refresh: fit,
  }
}

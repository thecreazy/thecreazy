import * as THREE from 'three'
import type { StageState } from '../stage/state'
import { SIDE, HEIGHT, texWhite, texWord, texFrameBand } from './textures'
import { createHoloMaterial } from './holo'
import { buildFrame } from './frame'

// The diamond: a white slab with the name ticking along its sides that
// changes skin section by section (intro → holographic → empty frame →
// white again) and finally spins, grows and dissolves before the CV.

// The original prototype ran on three r128 with no colour management and
// legacy lights: reproduce that look on modern three.
THREE.ColorManagement.enabled = false
const LIGHT = Math.PI

const BREATH_PERIOD = 4.5
const TOP_MARGIN_PX = 10
const VEIL_GAP_PX = 24

interface Options {
  reducedMotion: boolean
}

export async function createDiamond(canvas: HTMLCanvasElement, { reducedMotion }: Options) {
  // Side textures are drawn on canvas: the display font must be ready first.
  await document.fonts.load('64px "Archivo Black"').catch(() => undefined)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, -3.5, 6.5)
  camera.lookAt(0, 0.5, 0)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8 * LIGHT)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0 * LIGHT)
  dirLight.position.set(2, 3, 4)
  // Slowly orbiting light for moving highlights on the white faces.
  const sweepLight = new THREE.DirectionalLight(0xffffff, 1.1 * LIGHT)
  sweepLight.position.set(4, 2, 0)
  scene.add(ambientLight, dirLight, sweepLight)

  // ─── intro skin ──────────────────────────────────────────────────────────
  const TEX_WHITE = texWhite()
  const TEX_RICCARDO = texWord('Riccardo')
  const TEX_CANELLA = texWord('Canella')
  const TEX_BAND = texFrameBand('Riccardo Canella')
  TEX_BAND.repeat.x = 2 // the band spans two walls (U 0 → 2)

  const skin = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ map, roughness: 0.5, transparent: true, depthWrite: false })
  const matWhite = skin(TEX_WHITE)
  const matRiccardo = skin(TEX_RICCARDO)
  const matCanella = skin(TEX_CANELLA)
  const introSkins = [matWhite, matRiccardo, matCanella]

  // BoxGeometry face order: [+X, -X, +Y, -Y, +Z, -Z].
  // -X is the visible face on the left, +Z the one on the right.
  const introFaces = [matWhite, matRiccardo, matWhite, matWhite, matCanella, matWhite]
  const hidden = new THREE.MeshBasicMaterial({ visible: false })
  const hiddenFaces = Array(6).fill(hidden)

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(SIDE, HEIGHT, SIDE), introFaces)
  mesh.rotation.y = Math.PI / 4
  mesh.renderOrder = 1

  // ─── holographic skin: twin mesh crossfaded over the intro one ───────────
  const holo = createHoloMaterial()
  const holoMesh = new THREE.Mesh(
    new THREE.BoxGeometry(SIDE * 1.001, HEIGHT * 1.001, SIDE * 1.001),
    holo.material
  )
  holoMesh.renderOrder = 1
  mesh.add(holoMesh)

  // Only the top and bottom perimeters (a full EdgesGeometry draws a
  // "square in a square" because of the perspective).
  const s = SIDE / 2
  const y = HEIGHT / 2
  // Closed loop of the four corners at height py, as line-segment pairs.
  const perimeter = (py: number) => {
    const c = [
      [-s, -s],
      [s, -s],
      [s, s],
      [-s, s],
    ]
    return c.flatMap(([x, z], i) => {
      const [nx, nz] = c[(i + 1) % 4]
      return [x, py, z, nx, py, nz]
    })
  }
  const edgesGeo = new THREE.BufferGeometry()
  edgesGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([...perimeter(y), ...perimeter(-y)], 3)
  )
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
  })
  const edges = new THREE.LineSegments(edgesGeo, edgesMat)
  mesh.add(edges)

  // ─── frame skin ──────────────────────────────────────────────────────────
  const frame = buildFrame(TEX_WHITE, TEX_BAND)
  frame.group.renderOrder = 2
  frame.group.visible = false
  mesh.add(frame.group)

  // Screen-plane spin for the exit lives on an outer group: the mesh's own
  // axes are already tilted by its Y rotation.
  const spinGroup = new THREE.Group()
  spinGroup.add(mesh)
  scene.add(spinGroup)

  // ─── layout ──────────────────────────────────────────────────────────────
  let viewW = 1
  let viewH = 1

  // Resting height near the top edge, from the camera frustum so that the
  // margin is the same in pixels on every screen.
  function topTargetY() {
    const dist = camera.position.z
    const visible = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist
    return visible / 2 - TOP_MARGIN_PX * (visible / viewH) - SIDE * 0.35
  }

  // Bottom edge (px) of the diamond once parked at the top: drives the mask
  // that fades the scrolling content away beneath it.
  function measureVeil() {
    const saved = spinGroup.position.y
    spinGroup.position.y = topTargetY()
    spinGroup.updateMatrixWorld(true)
    camera.updateMatrixWorld()
    const o = (SIDE / 2) * 1.06
    const v = new THREE.Vector3()
    let bottom = 0
    for (const cx of [-o, o])
      for (const cy of [-y, y])
        for (const cz of [-o, o]) {
          mesh.localToWorld(v.set(cx, cy, cz)).project(camera)
          bottom = Math.max(bottom, ((1 - v.y) / 2) * viewH)
        }
    spinGroup.position.y = saved
    document.documentElement.style.setProperty('--veil-h', `${Math.round(bottom + VEIL_GAP_PX)}px`)
  }

  function fit() {
    viewW = window.innerWidth
    viewH = window.innerHeight
    if (!viewW || !viewH) return
    const aspect = viewW / viewH
    camera.aspect = aspect
    // Narrow screens: widen the FOV so the slab doesn't look too close.
    camera.fov = aspect < 1 ? 50 + (1 - aspect) * 35 : 50
    camera.updateProjectionMatrix()
    renderer.setSize(viewW, viewH, false)
    measureVeil()
    if (state) apply(state)
  }

  // ─── scroll state → skins ────────────────────────────────────────────────
  let state: StageState | undefined
  let boxHidden = false

  function apply(st: StageState) {
    state = st
    const { holo: holoT, frame: frameT, cv: cvT, exit: exitT } = st

    spinGroup.position.y = st.move * topTargetY()

    // intro → holographic
    holoMesh.visible = holoT > 0.001

    // holographic → frame: both previous skins fade out together
    frame.materials.forEach((m) => (m.opacity = frameT))
    frame.edges.opacity = frameT * 0.2
    frame.group.visible = frameT > 0.001

    introSkins.forEach((m) => (m.opacity = (1 - holoT) * (1 - frameT)))
    holo.uniforms.uOpacity.value = holoT * (1 - frameT)
    edgesMat.opacity = 0.25 * (1 - frameT)
    edges.visible = frameT <= 0.001

    if (frameT >= 1 && !boxHidden) {
      boxHidden = true
      mesh.material = hiddenFaces
      holoMesh.visible = false
    } else if (frameT < 1 && boxHidden) {
      boxHidden = false
      mesh.material = introFaces
    }

    // frame → white skin again for the CV
    if (cvT > 0.001) {
      boxHidden = false
      mesh.material = introFaces
      introSkins.forEach((m) => (m.opacity = cvT))
      frame.materials.forEach((m) => (m.opacity = frameT * (1 - cvT)))
      frame.edges.opacity = frameT * 0.2 * (1 - cvT)
    }

    // exit: spin, grow and dissolve (fade only with reduced motion)
    if (!reducedMotion) {
      spinGroup.rotation.x = exitT * Math.PI * 2.5
      mesh.scale.setScalar(1 + exitT * exitT * 6)
    }
    const exitOpacity = 1 - exitT
    introSkins.forEach((m) => (m.opacity *= exitOpacity))
    mesh.visible = exitOpacity > 0.001
  }

  // ─── render loop ─────────────────────────────────────────────────────────
  const clock = new THREE.Clock()
  let drawn = false

  function frameLoop() {
    requestAnimationFrame(frameLoop)
    // Nothing on screen after the exit: clear once, then idle.
    if (!mesh.visible) {
      if (drawn) renderer.clear()
      drawn = false
      return
    }
    drawn = true

    const t = reducedMotion ? 2 : clock.getElapsedTime()
    holo.uniforms.uTime.value = t

    // "Lightbox" breathing, white to whiter, only on the intro skin.
    const breath = state ? 1 - Math.min(state.holo + state.frame, 1) : 1
    const cycle = reducedMotion ? 0.5 : (Math.sin((t / BREATH_PERIOD) * Math.PI * 2) + 1) / 2
    ambientLight.intensity = (1.4 + cycle * 1.1 * breath) * LIGHT
    dirLight.intensity = (0.7 + cycle * 0.6 * breath) * LIGHT

    // Ticker: the name scrolls along the faces.
    TEX_RICCARDO.offset.x = (t * 0.08) % 1
    TEX_CANELLA.offset.x = -(t * 0.08) % 1
    TEX_BAND.offset.x = (t * 0.06) % 1

    sweepLight.position.set(Math.cos(t * 0.4) * 4, 2, Math.sin(t * 0.4) * 4)

    renderer.render(scene, camera)
  }

  window.addEventListener('resize', fit)
  window.addEventListener('orientationchange', () => setTimeout(fit, 150))
  fit()
  frameLoop()

  return { update: apply }
}

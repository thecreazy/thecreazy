import * as THREE from 'three'
import type { StageState } from '../stage/state'
import { SIDE, HEIGHT, texWhite, texWord, texFrameBand } from './textures'
import { createHoloMaterial } from './holo'
import { buildFrame } from './frame'
import type { ArticleChange } from '../articles'
import { buildTower } from './tower'
import { turnProgress } from '../cv/build'

// The diamond: a white slab with the name ticking along its sides that
// changes skin section by section (intro → holographic → empty frame →
// white again) and finally becomes the cap of the CV tower.

// The original prototype ran on three r128 with no colour management and
// legacy lights: reproduce that look on modern three.
THREE.ColorManagement.enabled = false
const LIGHT = Math.PI

const BREATH_PERIOD = 4.5
const TOP_MARGIN_PX = 10
// Size on the intro, relative to the parked size it grows back to while rising.
const INTRO_SCALE = 0.72
const VEIL_GAP_PX = 24
// Where the bottom of the CV tower sits, in NDC (-1 = bottom edge).
const TOWER_BOTTOM_NDC = -0.72
const TOWER_BOTTOM_NDC_NARROW = -0.38
// On wide screens the tower moves right, leaving room for the CV list.
const TOWER_SHIFT = 0.14

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
  // Frame band: the title of the article currently shown in what i write.
  const bands = new Map<string, THREE.Texture>()
  const bandFor = (text: string) => {
    if (!bands.has(text)) bands.set(text, texFrameBand(text))
    return bands.get(text)!
  }
  const firstTitle = document.querySelector<HTMLElement>('[data-articles]')?.dataset.current
  let band = bandFor(firstTitle || 'Riccardo Canella')
  let pendingBand: THREE.Texture | null = null
  let bandFade = 1
  let textWallBase = 0

  window.addEventListener('article:change', (e) => {
    const next = bandFor((e as CustomEvent<ArticleChange>).detail.title)
    pendingBand = next === band ? null : next
  })

  const skin = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ map, roughness: 0.5, transparent: true, depthWrite: false })
  const matWhite = skin(TEX_WHITE)
  const matRiccardo = skin(TEX_RICCARDO)
  const matCanella = skin(TEX_CANELLA)
  const introSkins = [matWhite, matRiccardo, matCanella]

  // BoxGeometry face order: [+X, -X, +Y, -Y, +Z, -Z].
  // -X is the visible face on the left, +Z the one on the right; the name is
  // also on the opposite faces so it stays readable when the CV tower turns.
  const introFaces = [matRiccardo, matRiccardo, matWhite, matWhite, matCanella, matCanella]
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
  const frame = buildFrame(TEX_WHITE, band)
  frame.group.renderOrder = 2
  frame.group.visible = false
  mesh.add(frame.group)

  // ─── CV tower, hanging under the diamond ─────────────────────────────────
  const tower = buildTower(
    [...document.querySelectorAll<HTMLElement>('[data-cv-entry]')].map((el) => ({
      company: el.dataset.company ?? '',
      period: el.dataset.period ?? '',
    })),
    TEX_WHITE,
    skin
  )

  // Outer group: position, scale and the tower's final turn apply to the
  // diamond and the tower together.
  const spinGroup = new THREE.Group()
  spinGroup.scale.setScalar(INTRO_SCALE)
  spinGroup.add(mesh, tower.group)
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

  // Screen geometry of the diamond once parked at the top, written as CSS
  // variables: --veil-h (bottom edge, drives the mask that fades content
  // beneath it) and --hole-* (the opening of the frame skin, where the
  // what i write heading sits).
  function measureParked() {
    const saved = { y: spinGroup.position.y, x: spinGroup.position.x, s: spinGroup.scale.x }
    const savedRot = { spin: spinGroup.rotation.y, mesh: mesh.rotation.y }
    spinGroup.position.set(0, topTargetY(), 0)
    spinGroup.scale.setScalar(1)
    spinGroup.rotation.y = 0
    mesh.rotation.y = Math.PI / 4
    spinGroup.updateMatrixWorld(true)
    camera.updateMatrixWorld()

    const v = new THREE.Vector3()
    const toPx = (lx: number, ly: number, lz: number) => {
      mesh.localToWorld(v.set(lx, ly, lz)).project(camera)
      return { x: ((v.x + 1) / 2) * viewW, y: ((1 - v.y) / 2) * viewH }
    }

    const o = (SIDE / 2) * 1.06
    let bottom = 0
    for (const cx of [-o, o])
      for (const cy of [-y, y])
        for (const cz of [-o, o]) bottom = Math.max(bottom, toPx(cx, cy, cz).y)

    // The opening seen through the frame: intersection of the inner rims of
    // the top and bottom faces, approximated by their common bounding box.
    const i = o - SIDE * 0.16
    const rim = (py: number) => {
      const pts = [toPx(-i, py, -i), toPx(i, py, -i), toPx(i, py, i), toPx(-i, py, i)]
      const xs = pts.map((p) => p.x)
      const ys = pts.map((p) => p.y)
      return { l: Math.min(...xs), r: Math.max(...xs), t: Math.min(...ys), b: Math.max(...ys) }
    }
    const a = rim(y)
    const b = rim(-y)
    const hole = {
      l: Math.max(a.l, b.l),
      r: Math.min(a.r, b.r),
      t: Math.max(a.t, b.t),
      b: Math.min(a.b, b.b),
    }

    spinGroup.position.set(saved.x, saved.y, 0)
    spinGroup.scale.setScalar(saved.s)
    spinGroup.rotation.y = savedRot.spin
    mesh.rotation.y = savedRot.mesh

    const css = document.documentElement.style
    const px = (n: number) => `${Math.round(n)}px`
    css.setProperty('--veil-h', px(bottom + VEIL_GAP_PX))
    css.setProperty('--hole-x', px((hole.l + hole.r) / 2))
    css.setProperty('--hole-y', px((hole.t + hole.b) / 2))
    css.setProperty('--hole-w', px(hole.r - hole.l))
    css.setProperty('--hole-h', px(hole.b - hole.t))
  }

  // World x of the tower on wide screens, and the vertical room it gets
  // between the diamond and the bottom of the screen.
  let towerShift = 0

  function layoutTower() {
    const aspect = viewW / viewH
    const top = topTargetY()
    const dist = camera.position.distanceTo(new THREE.Vector3(0, top, 0))
    const visibleW = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist * aspect
    towerShift = aspect > 1.15 ? TOWER_SHIFT * visibleW : 0

    // World y where the given NDC height meets the z = 0 plane.
    // Same threshold as the CV layout in CSS (max-aspect-ratio: 23/20).
    const ndcY = aspect <= 1.15 ? TOWER_BOTTOM_NDC_NARROW : TOWER_BOTTOM_NDC
    const ray = new THREE.Vector3(0, ndcY, 0.5).unproject(camera).sub(camera.position)
    const bottomY = camera.position.y + ray.y * (-camera.position.z / ray.z)
    tower.layout(Math.max(0.5, top - HEIGHT / 2 - bottomY))
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
    camera.updateMatrixWorld()
    measureParked()
    layoutTower()
    if (state) apply(state)
  }

  // ─── scroll state → skins ────────────────────────────────────────────────
  let state: StageState | undefined
  let boxHidden = false

  function apply(st: StageState) {
    state = st
    const { holo: holoT, frame: frameT, cv: cvT } = st

    spinGroup.position.y = st.move * topTargetY()
    spinGroup.position.x = cvT * towerShift
    // Quarter turn while the what i code track scrolls sideways. The skin is
    // fully holographic there (same pattern on every face, no text), so the
    // square slab looks identical at 0° and 90°: at the end of the track the
    // turn snaps back to 0° invisibly and the next skins keep their text on
    // the right faces.
    if (!reducedMotion) {
      mesh.rotation.y = Math.PI / 4 + (st.works % 1) * (Math.PI / 2)
      holo.uniforms.uQuarter.value = st.works >= 1 ? 1 : 0
    }
    spinGroup.scale.setScalar(INTRO_SCALE + (1 - INTRO_SCALE) * st.move)

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

    // CV: slabs drop under the diamond, then the whole tower turns.
    tower.update(st.build, cvT, reducedMotion)
    if (!reducedMotion) {
      const turn = turnProgress(st.build)
      spinGroup.rotation.y = turn * turn * (3 - 2 * turn) * (Math.PI / 2)
    }

    textWallBase = frame.textWall.opacity
  }

  // ─── render loop ─────────────────────────────────────────────────────────
  const clock = new THREE.Clock()
  let lastNow = performance.now()

  function frameLoop(now = performance.now()) {
    requestAnimationFrame(frameLoop)

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
    band.offset.x = (t * 0.06 * band.userData.speed) % 1
    tower.tick(t)

    // Title change: fade the band out, swap the texture, fade it back in.
    const dt = Math.min((now - lastNow) / 1000, 0.1)
    lastNow = now
    if (pendingBand) {
      bandFade = Math.max(0, bandFade - dt * 5)
      if (bandFade === 0) {
        band = pendingBand
        pendingBand = null
        frame.textWall.map = band
      }
    } else {
      bandFade = Math.min(1, bandFade + dt * 5)
    }
    frame.textWall.opacity = textWallBase * bandFade

    sweepLight.position.set(Math.cos(t * 0.4) * 4, 2, Math.sin(t * 0.4) * 4)

    renderer.render(scene, camera)
  }

  window.addEventListener('resize', fit)
  window.addEventListener('orientationchange', () => setTimeout(fit, 150))
  fit()
  frameLoop()

  return { update: apply }
}

import * as THREE from 'three'
import { SIDE, HEIGHT, texWord } from './textures'
import { slabProgress } from '../cv/build'

// The CV tower: one slab per job, stacked under the diamond, oldest at the
// bottom. Every slab is a smaller sibling of the diamond: the company ticks
// on two opposite faces, the period on the other two. Slabs drop into place
// one after the other while the CV section scrolls by.

export interface TowerEntry {
  company: string
  period: string
}

const FOOTPRINT = SIDE * 0.86
const MAX_DROP = 0.9

// Top and bottom perimeters of a unit box, as line-segment pairs.
function unitPerimeter() {
  const c = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ]
  const loop = (y: number) =>
    c.flatMap(([x, z], i) => {
      const [nx, nz] = c[(i + 1) % 4]
      return [x, y, z, nx, y, nz]
    })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...loop(0.5), ...loop(-0.5)], 3))
  return g
}

export function buildTower(
  entries: TowerEntry[],
  white: THREE.Texture,
  skin: (map: THREE.Texture) => THREE.MeshStandardMaterial
) {
  const group = new THREE.Group()
  group.rotation.y = Math.PI / 4
  group.visible = false

  const box = new THREE.BoxGeometry(1, 1, 1)
  const outline = unitPerimeter()
  const n = entries.length

  // k = 0 is the oldest job, at the bottom of the tower.
  const slabs = [...entries].reverse().map((entry) => {
    const company = texWord(entry.company)
    const period = texWord(entry.period)
    const companyMat = skin(company)
    const periodMat = skin(period)
    const whiteMat = skin(white)
    // BoxGeometry face order: [+X, -X, +Y, -Y, +Z, -Z].
    const mesh = new THREE.Mesh(box, [
      companyMat,
      companyMat,
      whiteMat,
      whiteMat,
      periodMat,
      periodMat,
    ])
    mesh.renderOrder = 1
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })
    mesh.add(new THREE.LineSegments(outline, edgeMat))
    group.add(mesh)
    return {
      mesh,
      textures: [company, period],
      materials: [companyMat, periodMat, whiteMat],
      edgeMat,
      restY: 0,
      drop: 0,
    }
  })

  /** Fit the stack in `span` world units below the diamond. */
  function layout(span: number) {
    const step = span / n
    const slabH = Math.min(HEIGHT, step * 0.78)
    const gap = step - slabH
    slabs.forEach((s, k) => {
      const above = n - 1 - k
      s.restY = -HEIGHT / 2 - gap - above * step - slabH / 2
      // Drop from higher up, but never through the slab or diamond above.
      s.drop = Math.min(MAX_DROP, above * step + gap * 0.6)
      s.mesh.scale.set(FOOTPRINT, slabH, FOOTPRINT)
      // Keep the glyphs' proportions whatever the text length: show as much
      // of the canvas as fits the face at its natural aspect.
      s.textures.forEach((t) => {
        const img = t.image as HTMLCanvasElement
        t.repeat.x = ((FOOTPRINT / slabH) * img.height) / img.width
      })
    })
  }

  function update(build: number, visibility: number, reducedMotion: boolean) {
    group.visible = visibility > 0.001
    slabs.forEach((s, k) => {
      const p = slabProgress(build, k, n)
      const eased = 1 - (1 - p) ** 3
      s.mesh.position.y = s.restY + (reducedMotion ? 0 : (1 - eased) * s.drop)
      const opacity = Math.min(1, p / 0.4) * visibility
      s.materials.forEach((m) => (m.opacity = opacity))
      s.edgeMat.opacity = 0.25 * opacity
      s.mesh.visible = opacity > 0.001
    })
  }

  // Tickers: neighbouring slabs run in opposite directions.
  function tick(t: number) {
    slabs.forEach((s, k) => {
      const dir = k % 2 ? 1 : -1
      s.textures[0].offset.x = (dir * t * 0.05 + k * 0.17) % 1
      s.textures[1].offset.x = (-dir * t * 0.04 + k * 0.29) % 1
    })
  }

  return { group, layout, update, tick }
}

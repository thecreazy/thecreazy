import * as THREE from 'three'
import { SIDE, HEIGHT } from './textures'

// "Empty frame" skin: only the perimeter of the slab (thick border with a
// hole in the middle). The name band runs on the same two outer walls used
// by the intro skin (-X and +Z), joined into one continuous ribbon.

export interface Frame {
  group: THREE.Group
  materials: THREE.MeshStandardMaterial[]
  /** The material carrying the name/title band (also in `materials`). */
  textWall: THREE.MeshStandardMaterial
  edges: THREE.LineBasicMaterial
}

type Vec3 = [number, number, number]

function geometry(points: Vec3[], uv?: [number, number][], index?: number[]) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv.flat(), 2))
  if (index) g.setIndex(index)
  g.computeVertexNormals()
  return g
}

// Two triangles for the vertical wall between corners a and b, with the
// U coordinate running from u0 to u1.
function wall(
  a: [number, number],
  b: [number, number],
  yTop: number,
  yBot: number,
  u0 = 0,
  u1 = 1
) {
  const points: Vec3[] = [
    [a[0], yTop, a[1]],
    [b[0], yTop, b[1]],
    [b[0], yBot, b[1]],
    [a[0], yTop, a[1]],
    [b[0], yBot, b[1]],
    [a[0], yBot, a[1]],
  ]
  const uv: [number, number][] = [
    [u0, 1],
    [u1, 1],
    [u1, 0],
    [u0, 1],
    [u1, 0],
    [u0, 0],
  ]
  return { points, uv }
}

// The four corners of a square of half-size h at height y.
const ring = (h: number, y: number): Vec3[] => [
  [-h, y, -h],
  [h, y, -h],
  [h, y, h],
  [-h, y, h],
]

const frameMaterial = (map: THREE.Texture) =>
  new THREE.MeshStandardMaterial({
    map,
    roughness: 0.4,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  })

export function buildFrame(white: THREE.Texture, bandTex: THREE.Texture): Frame {
  // Slightly bigger than the box: avoids z-fighting with the box faces
  // while both are visible during the crossfade.
  const oh = (SIDE / 2) * 1.06
  const ih = oh - SIDE * 0.16
  const yTop = HEIGHT / 2
  const yBot = -HEIGHT / 2
  const group = new THREE.Group()

  // Top ring: plain white. Vertices 0-3 outer, 4-7 inner.
  const topGeo = geometry(
    [...ring(oh, yTop), ...ring(ih, yTop)],
    undefined,
    [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]
  )
  const topMat = frameMaterial(white)
  group.add(new THREE.Mesh(topGeo, topMat))

  // Outer text walls -X and +Z with continuous UVs (U 0→1, then 1→2).
  const negX = wall([-oh, -oh], [-oh, oh], yTop, yBot, 0, 1)
  const posZ = wall([-oh, oh], [oh, oh], yTop, yBot, 1, 2)
  const textWallGeo = geometry([...negX.points, ...posZ.points], [...negX.uv, ...posZ.uv])
  const textWallMat = frameMaterial(bandTex)
  group.add(new THREE.Mesh(textWallGeo, textWallMat))

  // Remaining outer walls +X and -Z: plain white.
  const whiteWallMat = frameMaterial(white)
  const posX = wall([oh, oh], [oh, -oh], yTop, yBot)
  const negZ = wall([oh, -oh], [-oh, -oh], yTop, yBot)
  group.add(new THREE.Mesh(geometry(posX.points, posX.uv), whiteWallMat))
  group.add(new THREE.Mesh(geometry(negZ.points, negZ.uv), whiteWallMat))

  // Bottom ring + inner walls towards the hole.
  // Vertices: 0-3 top outer, 4-7 top inner, 8-11 bottom outer, 12-15 bottom inner.
  const restGeo = geometry(
    [...ring(oh, yTop), ...ring(ih, yTop), ...ring(oh, yBot), ...ring(ih, yBot)],
    undefined,
    [
      // bottom ring
      9, 8, 12, 9, 12, 13, 10, 9, 13, 10, 13, 14, 11, 10, 14, 11, 14, 15, 8, 11, 15, 8, 15, 12,
      // inner walls
      4, 13, 12, 4, 5, 13, 5, 14, 13, 5, 6, 14, 6, 15, 14, 6, 7, 15, 7, 12, 15, 7, 4, 12,
    ]
  )
  const restMat = frameMaterial(white)
  group.add(new THREE.Mesh(restGeo, restMat))

  const edges = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(restGeo), edges))

  return {
    group,
    materials: [topMat, textWallMat, whiteWallMat, restMat],
    textWall: textWallMat,
    edges,
  }
}

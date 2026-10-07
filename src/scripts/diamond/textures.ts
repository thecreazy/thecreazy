import * as THREE from 'three'

export const SIDE = 3
export const HEIGHT = SIDE / 6

// Side faces are wide and short (SIDE × HEIGHT): canvases keep the same
// proportions, otherwise three.js stretches the texture and the type deforms.
const TEX_W = 1200
const TEX_H = Math.round(TEX_W * (HEIGHT / SIDE))

const FACE = '#f5f4f0'
const INK = '#1a1a1a'
const FONT = '"Archivo Black", "Arial Black", Arial, sans-serif'

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

// A repeated word band whose width is an exact multiple of one repetition,
// so that RepeatWrapping never glues a half letter to the next cycle.
function band(text: string, targetWidth: number, height: number) {
  const fontSize = Math.round(height * 0.85)
  const font = `900 ${fontSize}px ${FONT}`
  const single = `${text.toUpperCase()}   `

  const measure = makeCanvas(10, 10).getContext('2d')!
  measure.font = font
  const singleWidth = measure.measureText(single).width
  const repeats = Math.max(Math.round(targetWidth / singleWidth), 1)
  const width = Math.round(singleWidth * repeats)

  const c = makeCanvas(width, height)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = FACE
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = font
  ctx.fillText(single.repeat(repeats), 0, height / 2)
  return c
}

export function texWhite() {
  const c = makeCanvas(TEX_W, TEX_H)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = FACE
  ctx.fillRect(0, 0, TEX_W, TEX_H)
  return toTex(c)
}

export const texWord = (word: string) => toTexRepeat(band(word, TEX_W, TEX_H))

export const texFrameBand = (text: string) => toTexRepeat(band(text, 2400, 300))

function toTex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

function toTexRepeat(c: HTMLCanvasElement) {
  const t = toTex(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

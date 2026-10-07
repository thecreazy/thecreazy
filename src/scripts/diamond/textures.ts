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

const BAND_H = 300
const BAND_TARGET = 2400
// Safe texture width on mobile GPUs.
const MAX_TEX = 4096

// Name/title band for the frame walls. Long titles get a shorter canvas to
// stay under MAX_TEX; repeat and speed are normalised on BAND_TARGET so the
// glyphs keep the same size and pace on the walls whatever the text length
// ("RICCARDO CANELLA" ≈ BAND_TARGET repeats twice across the two walls).
export function texFrameBand(text: string) {
  let c = band(text, BAND_TARGET, BAND_H)
  const natural = c.width
  if (natural > MAX_TEX) {
    const k = MAX_TEX / natural
    c = band(text, BAND_TARGET * k, Math.floor(BAND_H * k))
  }
  const t = toTexRepeat(c)
  t.repeat.x = (2 * BAND_TARGET) / natural
  t.userData.speed = BAND_TARGET / natural
  return t
}

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

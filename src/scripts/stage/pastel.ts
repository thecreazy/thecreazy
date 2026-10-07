// Watercolour pastel background of the intro. Painted once on a 2D canvas,
// then scaled/cropped with CSS to match the framing of the original WebGL
// version (a big textured plane far behind the diamond), so it also works
// when WebGL is not available.

const SIZE = 1024

const BLOBS: [string, number, number, number][] = [
  ['#e888c0', 0.15, 0.15, 0.4],
  ['#a888e0', 0.75, 0.1, 0.35],
  ['#78d8a8', 0.7, 0.7, 0.45],
  ['#78b8e0', 0.5, 0.5, 0.5],
  ['#c898e0', 0.1, 0.75, 0.35],
  ['#e8c878', 0.85, 0.85, 0.3],
]

export function paintPastel(canvas: HTMLCanvasElement) {
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#f2eee6'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Organic "brush strokes": several offset, rotated ellipses per blob.
  for (const [color, bx, by, br] of BLOBS) {
    const cx = bx * SIZE
    const cy = by * SIZE
    const r = br * SIZE
    for (let k = 0; k < 5; k++) {
      const ox = (Math.random() - 0.5) * r * 0.6
      const oy = (Math.random() - 0.5) * r * 0.6
      const rx = r * (0.5 + Math.random() * 0.5)
      const ry = r * (0.5 + Math.random() * 0.5)
      const max = Math.max(rx, ry)
      const g = ctx.createRadialGradient(cx + ox, cy + oy, 5, cx + ox, cy + oy, max)
      g.addColorStop(0, color)
      g.addColorStop(1, 'transparent')
      ctx.globalAlpha = 0.35
      ctx.fillStyle = g
      ctx.save()
      ctx.translate(cx + ox, cy + oy)
      ctx.rotate(Math.random() * Math.PI)
      ctx.scale(rx / max, ry / max)
      ctx.beginPath()
      ctx.arc(0, 0, max, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
  ctx.globalAlpha = 1

  // Watercolour paper grain.
  const img = ctx.getImageData(0, 0, SIZE, SIZE)
  const d = img.data
  for (let p = 0; p < d.length; p += 4) {
    const n = (Math.random() - 0.5) * 18
    d[p] = Math.min(255, Math.max(0, d[p] + n))
    d[p + 1] = Math.min(255, Math.max(0, d[p + 1] + n))
    d[p + 2] = Math.min(255, Math.max(0, d[p + 2] + n))
  }
  ctx.putImageData(img, 0, 0)

  // Sparse dark speckles.
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(60,50,70,${Math.random() * 0.08})`
    ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, 1.5, 1.5)
  }
}

// In the WebGL original the texture covered an 80×80 plane ~19.4 units from
// the camera, with the view centred at ~(0.5, 0.417) of the texture: only a
// small, heavily magnified crop was visible. Reproduce that crop here.
const PLANE = 80
const DISTANCE = 19.4
const CENTER_X = 0.5
const CENTER_Y = 0.417

export function layoutPastel(canvas: HTMLCanvasElement) {
  const w = window.innerWidth
  const h = window.innerHeight
  const aspect = w / h
  const fov = aspect < 1 ? 50 + (1 - aspect) * 35 : 50
  const visible = 2 * Math.tan((fov * Math.PI) / 360) * DISTANCE
  const size = (h * PLANE) / visible

  Object.assign(canvas.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${w / 2 - CENTER_X * size}px`,
    top: `${h / 2 - CENTER_Y * size}px`,
  })
}

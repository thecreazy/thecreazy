// Painter of src/assets/pastel.webp, the watercolour background of the
// intro. NOT loaded by the site: the image is pre-rendered (painting it on
// every visit was too slow on phones). It paints only the region that is
// ever visible (CROP in pastel.ts) at full resolution, with a seeded random
// so the result is reproducible. To regenerate: run paintPastel on a canvas
// in a browser and save canvas.toDataURL('image/webp', 0.86).

export const WIDTH = 1843
export const HEIGHT = 1106

// Soft pastels: pink, lavender, mint, sky, peach, lilac, aqua.
const PALETTE = ['#f2a7d0', '#c3a8f0', '#9fe6c4', '#a9d4f5', '#f7c9a8', '#d9b3f2', '#a8ece6']

// mulberry32: tiny seeded PRNG.
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

export function paintPastel(canvas: HTMLCanvasElement, seed = 3) {
  const W = (canvas.width = WIDTH)
  const H = (canvas.height = HEIGHT)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rand = seeded(seed)
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)]

  ctx.fillStyle = '#f4efe9'
  ctx.fillRect(0, 0, W, H)

  // A soft elliptical wash fading into its own colour (never to black).
  function wash(x: number, y: number, r: number, color: string, alpha: number) {
    const rx = r * (0.6 + rand() * 0.6)
    const ry = r * (0.4 + rand() * 0.5)
    const max = Math.max(rx, ry)
    ctx!.save()
    ctx!.translate(x, y)
    ctx!.rotate(rand() * Math.PI)
    ctx!.scale(rx / max, ry / max)
    // Half the washes are soft, half dried with a crisper edge.
    const crisp = rand() < 0.5
    const g = ctx!.createRadialGradient(0, 0, max * 0.05, 0, 0, max)
    g.addColorStop(0, rgba(color, alpha))
    g.addColorStop(crisp ? 0.86 : 0.65, rgba(color, alpha * (crisp ? 0.75 : 0.55)))
    g.addColorStop(1, rgba(color, 0))
    ctx!.fillStyle = g
    ctx!.beginPath()
    ctx!.arc(0, 0, max, 0, Math.PI * 2)
    ctx!.fill()
    // Wet edge: pigment gathers on the rim of a watercolour stroke.
    if (crisp || rand() < 0.4) {
      ctx!.filter = 'blur(3px)'
      ctx!.strokeStyle = rgba(color, Math.min(1, alpha * 1.1))
      ctx!.lineWidth = 3 + rand() * 4
      ctx!.beginPath()
      const from = rand() * Math.PI * 2
      ctx!.arc(0, 0, max * (0.75 + rand() * 0.2), from, from + 0.8 + rand() * 1.6)
      ctx!.stroke()
      ctx!.filter = 'none'
    }
    ctx!.restore()
  }

  // 1. Layered washes, denser towards the edges.
  for (let i = 0; i < 24; i++) {
    const edge = rand() < 0.65
    const x = edge ? (rand() < 0.5 ? rand() * 0.35 : 0.65 + rand() * 0.35) * W : rand() * W
    const y = rand() * H
    wash(x, y, (0.12 + rand() * 0.3) * W, pick(PALETTE), 0.28 + rand() * 0.3)
  }

  // 2. Lighter centre, where the diamond and the name sit.
  const centre = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, W * 0.42)
  centre.addColorStop(0, 'rgba(250,247,243,0.7)')
  centre.addColorStop(1, 'rgba(250,247,243,0)')
  ctx.fillStyle = centre
  ctx.fillRect(0, 0, W, H)

  // 3. Spray: clusters of coloured specks.
  for (let c = 0; c < 6; c++) {
    const cx = (rand() < 0.5 ? rand() * 0.3 : 0.7 + rand() * 0.3) * W
    const cy = rand() * H
    const spread = 40 + rand() * 120
    const color = pick(['#9d7be0', '#e07bb4', '#6fb3e8', '#5fcf9f'])
    for (let i = 0; i < 1400; i++) {
      // Roughly gaussian spread.
      const r = spread * Math.sqrt(-2 * Math.log(rand() + 1e-6)) * 0.5
      const a = rand() * Math.PI * 2
      ctx.fillStyle = rgba(color, 0.12 + rand() * 0.35)
      const s = 0.6 + rand() * 2.2
      ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, s, s)
    }
  }

  // 4. Paper grain + sparse dark specks.
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data
  for (let p = 0; p < d.length; p += 4) {
    const n = (rand() - 0.5) * 16
    d[p] = Math.min(255, Math.max(0, d[p] + n))
    d[p + 1] = Math.min(255, Math.max(0, d[p + 1] + n))
    d[p + 2] = Math.min(255, Math.max(0, d[p + 2] + n))
  }
  ctx.putImageData(img, 0, 0)
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(60,50,70,${rand() * 0.07})`
    ctx.fillRect(rand() * W, rand() * H, 1.5, 1.5)
  }
}

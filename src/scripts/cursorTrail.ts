interface TrailPoint {
  x: number
  y: number
  t: number
}

export function initCursorTrail(): void {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998;'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize, { passive: true })

  const trail: TrailPoint[] = []
  const DURATION = 420

  document.addEventListener('mousemove', (e) => {
    trail.push({ x: e.clientX, y: e.clientY, t: performance.now() })
  })

  let accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--cursor-color')
    .trim()

  new MutationObserver(() => {
    accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--cursor-color')
      .trim()
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  const tick = () => {
    requestAnimationFrame(tick)
    const now = performance.now()

    while (trail.length && now - trail[0].t > DURATION) trail.shift()

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const p of trail) {
      const life = 1 - (now - p.t) / DURATION
      ctx.save()
      ctx.globalAlpha = life * 0.5
      ctx.fillStyle = accentColor
      ctx.shadowBlur = 14 * life
      ctx.shadowColor = accentColor
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3 * life, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  tick()
}

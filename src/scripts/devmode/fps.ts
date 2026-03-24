let fpsRAF: number | null = null
let lastTime = performance.now()
let frames = 0

export function startFPS(): void {
  const counterEl = document.getElementById('fps-counter')
  if (!counterEl) return

  function tick(now: number) {
    frames++
    if (now - lastTime >= 1000) {
      counterEl!.textContent = frames + ' fps'
      frames = 0
      lastTime = now

      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
      if (mem) {
        const memEl = document.getElementById('mem-value')
        if (memEl) memEl.textContent = Math.round(mem.usedJSHeapSize / 1048576) + ' MB'
      }

      const themeEl = document.getElementById('current-theme')
      if (themeEl) {
        themeEl.textContent = document.documentElement.getAttribute('data-theme') ?? '?'
      }

      const webglEl = document.getElementById('webgl-status')
      if (webglEl) {
        webglEl.textContent = document.getElementById('webgl-canvas') ? 'active' : 'off'
      }
    }
    fpsRAF = requestAnimationFrame(tick)
  }

  fpsRAF = requestAnimationFrame(tick)
}

export function stopFPS(): void {
  if (fpsRAF !== null) {
    cancelAnimationFrame(fpsRAF)
    fpsRAF = null
  }
}

export function initLCP(): void {
  if (typeof PerformanceObserver === 'undefined') return
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
      const el = document.getElementById('lcp-value')
      if (el) el.textContent = Math.round(last.startTime) + ' ms'
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    /* PerformanceObserver not supported */
  }
}

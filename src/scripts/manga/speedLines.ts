import { LINES_ID } from './constants'

export function drawSpeedLines(): Promise<void> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.id = LINES_ID
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')!
    const w = (canvas.width = window.innerWidth)
    const h = (canvas.height = window.innerHeight)
    const cx = w * 0.5
    const cy = h * 0.42
    const maxR = Math.sqrt(w * w + h * h)

    for (let i = 0; i < 160; i++) {
      const angle = (i / 160) * Math.PI * 2
      const jitter = (Math.random() - 0.5) * 0.05
      const startR = 30 + Math.random() * 60

      ctx.lineWidth = Math.random() * 2 + 0.2
      ctx.strokeStyle = `rgba(0,0,0,${(Math.random() * 0.35 + 0.08).toFixed(2)})`
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle + jitter) * startR, cy + Math.sin(angle + jitter) * startR)
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR)
      ctx.stroke()
    }

    canvas.style.opacity = '0'
    let opacity = 0
    let direction = 1
    let held = 0

    const tick = () => {
      if (direction === 1) {
        opacity = Math.min(opacity + 0.08, 1)
        if (opacity >= 1) direction = 0
      } else if (direction === 0) {
        held++
        if (held > 8) direction = -1
      } else {
        opacity = Math.max(opacity - 0.06, 0)
        if (opacity <= 0) {
          canvas.style.opacity = '0'
          resolve()
          return
        }
      }
      canvas.style.opacity = String(opacity)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

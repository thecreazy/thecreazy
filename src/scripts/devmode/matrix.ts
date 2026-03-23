let matrixRAF: number | null = null

function getMatrixColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  return {
    trail: isDark ? 'rgba(10,10,10,0.05)' : 'rgba(247,247,247,0.07)',
    char: isDark ? '#55a566' : '#01470f',
    head: isDark ? '#b6a8db' : '#5b21b6',
  }
}

export function startMatrix(): void {
  const canvas = document.getElementById('matrix-canvas') as HTMLCanvasElement | null
  if (!canvas) return
  const ctx = canvas.getContext('2d')!

  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  const cols = Math.floor(canvas.width / 16)
  const drops = Array<number>(cols).fill(1)
  const chars = '01アウエオカキクケコサシスセソタチツテトナニヌネノABCDEF<>{}[]|/'

  function draw() {
    const { trail, char, head } = getMatrixColors()

    ctx.fillStyle = trail
    ctx.fillRect(0, 0, canvas!.width, canvas!.height)
    ctx.font = '14px "IBM Plex Mono"'

    drops.forEach((y, i) => {
      const glyph = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillStyle = y === 1 ? head : char
      ctx.fillText(glyph, i * 16, y * 16)
      if (y * 16 > canvas!.height && Math.random() > 0.975) drops[i] = 0
      drops[i]++
    })

    matrixRAF = requestAnimationFrame(draw)
  }

  draw()
}

export function stopMatrix(): void {
  if (matrixRAF !== null) {
    cancelAnimationFrame(matrixRAF)
    matrixRAF = null
  }
}

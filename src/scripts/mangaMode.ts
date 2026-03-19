/**
 * mangaMode.ts
 * Loaded 100% on-demand via dynamic import.
 * Zero cost until the Konami code is entered.
 */

const STYLE_ID  = '__manga_styles__'
const TONE_ID   = '__manga_tone__'
const LINES_ID  = '__manga_lines__'
const SPLASH_ID = '__manga_splash__'
const IND_ID    = '__manga_indicator__'

// ── CSS injected when active ──────────────────────────────────────────────────

const CSS = `
/* Filter only on the scrollable content — never on body/html,
   otherwise position:fixed children (DevMode, ThemeToggle, cursor…)
   get a broken stacking context and fall out of the viewport. */
html.manga-mode main {
  filter: grayscale(1) contrast(1.4) brightness(1.08) !important;
}

html.manga-mode #webgl-canvas { opacity: 0 !important; transition: opacity 0.5s; }
html.manga-mode .scanlines    { display: none !important; }

html.manga-mode {
  --color-bg:      #ffffff;
  --color-surface: #f0f0f0;
  --color-text:    #000000;
  --color-accent:  #000000;
  --color-accent2: #111111;
  --color-dim:     #444444;
  --color-border:  #000000;
  --color-glow:    rgba(0,0,0,0.2);
  --scanline-color: transparent;
  --cursor-color:  #000000;
}

/* thick manga panel borders */
html.manga-mode .project-card    { border: 3px solid #000 !important; box-shadow: 4px 4px 0 #000 !important; }
html.manga-mode .social-link     { border: 2px solid #000 !important; box-shadow: 2px 2px 0 #000 !important; }
html.manga-mode .timeline-content{ border-left: 3px solid #000; padding-left: 16px; }

/* halftone screentone */
#${TONE_ID} {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background-image: radial-gradient(circle, rgba(0,0,0,0.18) 1px, transparent 1px);
  background-size: 5px 5px;
  mix-blend-mode: multiply;
  animation: toneIn 0.4s ease forwards;
}

/* speed lines canvas */
#${LINES_ID} {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}

/* speech bubbles */
.manga-bubble {
  position: fixed;
  pointer-events: none;
  z-index: 60;
  animation: bubbleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  filter: drop-shadow(3px 3px 0 rgba(0,0,0,0.3));
}

@keyframes bubbleIn {
  from { transform: scale(0) rotate(var(--rot)); opacity: 0; }
  to   { transform: scale(1) rotate(var(--rot)); opacity: 1; }
}

@keyframes bubbleOut {
  from { transform: scale(1) rotate(var(--rot)); opacity: 1; }
  to   { transform: scale(0) rotate(var(--rot)); opacity: 0; }
}

@keyframes toneIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* mode indicator */
#${IND_ID} {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 9999;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #000;
  background: #fff;
  border: 2px solid #000;
  padding: 8px 12px;
  box-shadow: 3px 3px 0 #000;
  animation: indIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes indIn {
  from { transform: translateY(120%) rotate(-3deg); }
  to   { transform: translateY(0)    rotate(-3deg); }
}

/* splash */
#${SPLASH_ID} {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 24px;
  animation: splashOut 0.4s ease 1.2s forwards;
}

@keyframes splashOut {
  from { opacity: 1; }
  to   { opacity: 0; pointer-events: none; }
}

.splash-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(20px, 5vw, 48px);
  color: #000;
  text-align: center;
  line-height: 1.6;
  border: 6px solid #000;
  padding: 24px 32px;
  box-shadow: 8px 8px 0 #000;
  animation: titlePulse 0.15s step-end 4;
}

.splash-sub {
  font-family: 'VT323', monospace;
  font-size: 28px;
  color: #000;
  letter-spacing: 6px;
}

@keyframes titlePulse {
  0%   { transform: scale(1);    background: #fff; color: #000; }
  50%  { transform: scale(1.04); background: #000; color: #fff; }
  100% { transform: scale(1);    background: #fff; color: #000; }
}
`

// ── Speech bubbles ────────────────────────────────────────────────────────────

const BUBBLE_DATA = [
  { text: 'NANI?!',  w: 200, h: 110, fontSize: 18 },
  { text: 'SUGOI!',  w: 180, h: 100, fontSize: 16 },
  { text: 'BAKA!!',  w: 170, h: 95,  fontSize: 16 },
  { text: 'やばい!', w: 190, h: 105, fontSize: 20 },
  { text: '最高!',   w: 165, h: 95,  fontSize: 22 },
]

const POSITIONS = [
  { top: '12%',  left: '5%'  },
  { top: '10%',  right: '6%' },
  { top: '45%',  left: '2%'  },
  { top: '60%',  right: '4%' },
  { top: '80%',  left: '8%'  },
]

const ROTS = [-8, 6, -4, 7, -5]

function makeBubbleSVG(text: string, w: number, h: number, fontSize: number): string {
  const rx = w / 2
  const ry = (h - 28) / 2
  const cx = w / 2
  const cy = ry + 4
  const tailX1 = cx - 20
  const tailX2 = cx + 20
  const tailY  = cy + ry
  const tipX   = cx - 30
  const tipY   = h

  return `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="${cx}" cy="${cy}" rx="${rx - 4}" ry="${ry - 2}"
    fill="white" stroke="black" stroke-width="3.5"/>
  <polygon points="${tailX1},${tailY} ${tipX},${tipY} ${tailX2},${tailY}"
    fill="white" stroke="black" stroke-width="3"
    stroke-linejoin="round" paint-order="stroke"/>
  <text x="${cx}" y="${cy + fontSize * 0.36}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="'Press Start 2P', monospace"
    font-size="${fontSize}" fill="black" font-weight="bold">${text}</text>
</svg>`
}

function injectBubbles() {
  BUBBLE_DATA.forEach((b, i) => {
    const el  = document.createElement('div')
    el.classList.add('manga-bubble')
    el.style.setProperty('--rot', `${ROTS[i]}deg`)
    Object.assign(el.style, POSITIONS[i])
    el.innerHTML = makeBubbleSVG(b.text, b.w, b.h, b.fontSize)
    el.style.animationDelay = `${i * 80 + 200}ms`
    document.body.appendChild(el)
  })
}

// ── Speed lines ───────────────────────────────────────────────────────────────

function drawSpeedLines(): Promise<void> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.id    = LINES_ID
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')!
    const w   = canvas.width  = window.innerWidth
    const h   = canvas.height = window.innerHeight
    const cx  = w * 0.5
    const cy  = h * 0.42

    const maxR = Math.sqrt(w * w + h * h)

    for (let i = 0; i < 140; i++) {
      const angle  = (i / 140) * Math.PI * 2
      const jitter = (Math.random() - 0.5) * 0.06
      const startR = 20 + Math.random() * 60
      const endR   = maxR

      ctx.lineWidth   = Math.random() * 1.8 + 0.2
      ctx.strokeStyle = `rgba(0,0,0,${(Math.random() * 0.3 + 0.1).toFixed(2)})`
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle + jitter) * startR, cy + Math.sin(angle + jitter) * startR)
      ctx.lineTo(cx + Math.cos(angle) * endR, cy + Math.sin(angle) * endR)
      ctx.stroke()
    }

    // flash in → hold briefly → fade out
    canvas.style.opacity = '0'
    let opacity   = 0
    let direction = 1
    let held      = 0

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

// ── Splash screen ─────────────────────────────────────────────────────────────

function showSplash(): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement('div')
    el.id    = SPLASH_ID
    el.innerHTML = `
      <div class="splash-title">MANGA MODE<br>ACTIVATED!</div>
      <div class="splash-sub">[ ↑↑↓↓←→←→BA ]</div>
    `
    document.body.appendChild(el)
    // resolve when splash starts to fade (after 1.2s)
    setTimeout(resolve, 1200)
  })
}

// ── Activate / Deactivate ─────────────────────────────────────────────────────

export async function activate() {
  // 1. inject CSS
  if (!document.getElementById(STYLE_ID)) {
    const style   = document.createElement('style')
    style.id      = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
  }

  // 2. splash
  await showSplash()

  // 3. apply mode class
  document.documentElement.classList.add('manga-mode')

  // 4. screen tone overlay
  if (!document.getElementById(TONE_ID)) {
    const tone = document.createElement('div')
    tone.id    = TONE_ID
    document.body.appendChild(tone)
  }

  // 5. speed lines (non-blocking)
  drawSpeedLines()

  // 6. speech bubbles
  injectBubbles()

  // 7. indicator
  if (!document.getElementById(IND_ID)) {
    const ind = document.createElement('div')
    ind.id    = IND_ID
    ind.textContent = 'MANGA MODE'
    document.body.appendChild(ind)
  }
}

export function deactivate() {
  // animate bubbles out
  document.querySelectorAll('.manga-bubble').forEach((b) => {
    const el = b as HTMLElement
    el.style.animation = 'bubbleOut 0.3s ease forwards'
    setTimeout(() => el.remove(), 350)
  })

  // remove overlays
  ;[TONE_ID, LINES_ID, SPLASH_ID, IND_ID].forEach((id) => {
    document.getElementById(id)?.remove()
  })

  // remove class (CSS transitions handle the rest)
  document.documentElement.classList.remove('manga-mode')
}

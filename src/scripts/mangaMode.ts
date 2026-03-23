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

html.manga-mode .project-card    { border: 3px solid #000 !important; box-shadow: 5px 5px 0 #000 !important; }
html.manga-mode .social-link     { border: 2px solid #000 !important; box-shadow: 3px 3px 0 #000 !important; }
html.manga-mode .timeline-content{ border-left: 3px solid #000; padding-left: 16px; }

/* halftone screentone */
#${TONE_ID} {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background-image: radial-gradient(circle, rgba(0,0,0,0.15) 1.2px, transparent 1.2px);
  background-size: 6px 6px;
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
  animation: bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.35));
}

@keyframes bubbleIn {
  from { transform: scale(0) rotate(var(--rot)); opacity: 0; }
  to   { transform: scale(1) rotate(var(--rot)); opacity: 1; }
}

@keyframes bubbleOut {
  from { transform: scale(1) rotate(var(--rot)); opacity: 1; }
  to   { transform: scale(0) rotate(var(--rot)); opacity: 0; }
}

/* blush marks */
.manga-blush {
  position: fixed;
  pointer-events: none;
  z-index: 61;
  animation: blushIn 0.6s ease both;
  opacity: 0.7;
}
@keyframes blushIn {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 0.7; transform: scale(1); }
}

/* floating sfx text */
.manga-sfx {
  position: fixed;
  pointer-events: none;
  z-index: 62;
  font-family: 'Press Start 2P', monospace;
  color: #000;
  animation: sfxIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  -webkit-text-stroke: 3px white;
  paint-order: stroke fill;
}
@keyframes sfxIn {
  from { transform: scale(0) rotate(var(--rot)); opacity: 0; }
  to   { transform: scale(1) rotate(var(--rot)); opacity: 1; }
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
  font-size: 12px;
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
  animation: splashOut 0.4s ease 1.4s forwards;
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

// ── SVG bubble builders ───────────────────────────────────────────────────────

/** Classic oval speech bubble */
function makeOvalSVG(text: string, w: number, h: number, fontSize: number, tailSide: 'left' | 'right' = 'left'): string {
  const bodyH = h - 36
  const cx    = w / 2
  const cy    = bodyH / 2 + 4
  const rx    = w / 2 - 6
  const ry    = bodyH / 2 - 4

  const tailBase = tailSide === 'left' ? cx - 24 : cx + 24
  const tailTip  = tailSide === 'left' ? 18 : w - 18
  const tipY     = h - 4

  // split multi-word text across lines
  const words = text.split(' ')
  const lines  = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [text]
  const lineH  = fontSize * 1.35

  const textLines = lines.map((l, i) => {
    const dy = cy - ((lines.length - 1) * lineH / 2) + i * lineH
    return `<text x="${cx}" y="${dy}"
      text-anchor="middle" dominant-baseline="central"
      font-family="'Press Start 2P', monospace"
      font-size="${fontSize}" fill="#000" font-weight="bold">${l}</text>`
  }).join('')

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" stroke="black" stroke-width="4"/>
  <polygon points="${tailBase - 10},${cy + ry - 4} ${tailTip},${tipY} ${tailBase + 10},${cy + ry - 4}"
    fill="white" stroke="black" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white"/>
  ${textLines}
</svg>`
}

/** Spiky burst bubble — for shock/action words */
function makeSpikySVG(text: string, size: number, fontSize: number): string {
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * 0.62
  const points = 16

  let path = ''
  for (let i = 0; i < points * 2; i++) {
    const r     = i % 2 === 0 ? outerR : innerR
    const angle = (i * Math.PI / points) - Math.PI / 2
    const x     = (cx + Math.cos(angle) * r).toFixed(2)
    const y     = (cy + Math.sin(angle) * r).toFixed(2)
    path += (i === 0 ? 'M' : 'L') + `${x},${y}`
  }
  path += 'Z'

  const words = text.split(' ')
  const lines  = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [text]
  const lineH  = fontSize * 1.4

  const textLines = lines.map((l, i) => {
    const dy = cy - ((lines.length - 1) * lineH / 2) + i * lineH
    return `<text x="${cx}" y="${dy}"
      text-anchor="middle" dominant-baseline="central"
      font-family="'Press Start 2P', monospace"
      font-size="${fontSize}" fill="#000" font-weight="bold">${l}</text>`
  }).join('')

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <path d="${path}" fill="white" stroke="black" stroke-width="3.5" stroke-linejoin="round"/>
  ${textLines}
</svg>`
}

/** Jagged rectangular scream bubble */
function makeJaggedSVG(text: string, w: number, h: number, fontSize: number): string {
  const pad   = 16
  const bodyH = h - 30
  const jag   = 8

  // zigzag top
  let top = `M${pad},${jag} `
  for (let x = pad; x < w - pad; x += jag * 2) top += `L${x + jag},0 L${x + jag * 2},${jag} `

  // right side
  const right = `L${w - pad},${bodyH} `

  // zigzag bottom
  let bot = ''
  for (let x = w - pad; x > pad; x -= jag * 2) bot += `L${x - jag},${bodyH + jag} L${x - jag * 2},${bodyH} `

  // left side + tail
  const jagPath = `${top}${right}${bot}L${pad},${jag}Z`

  const cx = w / 2
  const cy = bodyH / 2

  const words = text.split(' ')
  const lines  = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [text]
  const lineH  = fontSize * 1.35

  const textLines = lines.map((l, i) => {
    const dy = cy - ((lines.length - 1) * lineH / 2) + i * lineH
    return `<text x="${cx}" y="${dy}"
      text-anchor="middle" dominant-baseline="central"
      font-family="'Press Start 2P', monospace"
      font-size="${fontSize}" fill="#000" font-weight="bold">${l}</text>`
  }).join('')

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <path d="${jagPath}" fill="white" stroke="black" stroke-width="3.5" stroke-linejoin="round"/>
  <polygon points="${cx - 20},${bodyH} ${20},${h} ${cx + 20},${bodyH}"
    fill="white" stroke="black" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/>
  <path d="${jagPath}" fill="white"/>
  ${textLines}
</svg>`
}

// ── Bubble data ───────────────────────────────────────────────────────────────

type BubbleShape = 'oval' | 'spiky' | 'jagged'

interface BubbleDef {
  text:      string
  shape:     BubbleShape
  w:         number
  h:         number
  size:      number
  fontSize:  number
  tail?:     'left' | 'right'
}

const BUBBLE_DATA: BubbleDef[] = [
  { text: 'NANI?!',    shape: 'oval',   w: 260, h: 150, size: 260, fontSize: 18, tail: 'left'  },
  { text: 'SUGOI!!',   shape: 'spiky',  w: 230, h: 230, size: 230, fontSize: 14              },
  { text: 'BAKA!!',    shape: 'jagged', w: 250, h: 130, size: 250, fontSize: 18              },
  { text: 'やばい!',   shape: 'oval',   w: 220, h: 140, size: 220, fontSize: 26, tail: 'right' },
  { text: 'ARA ARA~',  shape: 'oval',   w: 290, h: 150, size: 290, fontSize: 14, tail: 'left'  },
  { text: 'YAMETE!!',  shape: 'spiky',  w: 220, h: 220, size: 220, fontSize: 13              },
  { text: '最高!!',    shape: 'jagged', w: 240, h: 130, size: 240, fontSize: 22              },
]

const POSITIONS: { top?: string; bottom?: string; left?: string; right?: string }[] = [
  { top:    '8%',  left:  '2%'  },
  { top:    '5%',  right: '2%'  },
  { top:   '42%',  left:  '1%'  },
  { top:   '52%',  right: '1%'  },
  { top:   '78%',  left:  '3%'  },
  { top:   '25%',  right: '2%'  },
  { bottom: '8%',  right: '3%'  },
]

const ROTS = [-10, 8, -5, 9, -7, 6, -12]

// ── Blush marks ───────────────────────────────────────────────────────────────

function injectBlush() {
  const positions = [
    { top: '38%', left: '18%' },
    { top: '38%', right: '18%' },
  ]
  positions.forEach((pos, i) => {
    const el = document.createElement('div')
    el.classList.add('manga-blush')
    Object.assign(el.style, pos)
    el.style.animationDelay = `${600 + i * 100}ms`
    el.innerHTML = `<svg width="60" height="22" viewBox="0 0 60 22" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="11" rx="28" ry="9" fill="rgba(255,100,130,0.45)"/>
      <line x1="14" y1="11" x2="46" y2="11" stroke="rgba(200,50,80,0.3)" stroke-width="2.5"/>
      <line x1="18" y1="7"  x2="42" y2="7"  stroke="rgba(200,50,80,0.2)" stroke-width="1.5"/>
      <line x1="18" y1="15" x2="42" y2="15" stroke="rgba(200,50,80,0.2)" stroke-width="1.5"/>
    </svg>`
    document.body.appendChild(el)
  })
}

// ── SFX floating text ─────────────────────────────────────────────────────────

const SFX_DATA = [
  { text: 'DOOOM!', size: 28, top: '20%',  left: '25%',  rot:  -8 },
  { text: 'KYAA~',  size: 22, top: '65%',  right: '20%', rot:   6 },
  { text: 'BWOOM',  size: 24, bottom: '20%', left: '30%', rot: -5 },
]

function injectSFX() {
  SFX_DATA.forEach((sfx, i) => {
    const el = document.createElement('div')
    el.classList.add('manga-sfx')
    el.style.setProperty('--rot', `${sfx.rot}deg`)
    el.style.fontSize = sfx.size + 'px'
    el.style.animationDelay = `${900 + i * 150}ms`
    if (sfx.top)    el.style.top    = sfx.top
    if (sfx.bottom) el.style.bottom = sfx.bottom
    if (sfx.left)   el.style.left   = sfx.left
    if (sfx.right)  el.style.right  = sfx.right
    el.textContent = sfx.text
    document.body.appendChild(el)
  })
}

// ── Inject bubbles ────────────────────────────────────────────────────────────

function injectBubbles() {
  BUBBLE_DATA.forEach((b, i) => {
    const el = document.createElement('div')
    el.classList.add('manga-bubble')
    el.style.setProperty('--rot', `${ROTS[i]}deg`)
    Object.assign(el.style, POSITIONS[i])
    el.style.animationDelay = `${i * 100 + 200}ms`

    if (b.shape === 'oval') {
      el.innerHTML = makeOvalSVG(b.text, b.w, b.h, b.fontSize, b.tail)
    } else if (b.shape === 'spiky') {
      el.innerHTML = makeSpikySVG(b.text, b.size, b.fontSize)
    } else {
      el.innerHTML = makeJaggedSVG(b.text, b.w, b.h, b.fontSize)
    }

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

    for (let i = 0; i < 160; i++) {
      const angle  = (i / 160) * Math.PI * 2
      const jitter = (Math.random() - 0.5) * 0.05
      const startR = 30 + Math.random() * 60
      const endR   = maxR

      ctx.lineWidth   = Math.random() * 2 + 0.2
      ctx.strokeStyle = `rgba(0,0,0,${(Math.random() * 0.35 + 0.08).toFixed(2)})`
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle + jitter) * startR, cy + Math.sin(angle + jitter) * startR)
      ctx.lineTo(cx + Math.cos(angle) * endR,            cy + Math.sin(angle) * endR)
      ctx.stroke()
    }

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
        if (opacity <= 0) { canvas.style.opacity = '0'; resolve(); return }
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
    setTimeout(resolve, 1400)
  })
}

// ── Activate / Deactivate ─────────────────────────────────────────────────────

export async function activate() {
  if (!document.getElementById(STYLE_ID)) {
    const style       = document.createElement('style')
    style.id          = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
  }

  await showSplash()

  document.documentElement.classList.add('manga-mode')

  if (!document.getElementById(TONE_ID)) {
    const tone = document.createElement('div')
    tone.id    = TONE_ID
    document.body.appendChild(tone)
  }

  drawSpeedLines()
  injectBubbles()
  injectBlush()
  injectSFX()

  if (!document.getElementById(IND_ID)) {
    const ind         = document.createElement('div')
    ind.id            = IND_ID
    ind.textContent   = 'MANGA MODE'
    document.body.appendChild(ind)
  }
}

export function deactivate() {
  document.querySelectorAll('.manga-bubble, .manga-blush, .manga-sfx').forEach((b) => {
    const el = b as HTMLElement
    el.style.animation = 'bubbleOut 0.3s ease forwards'
    setTimeout(() => el.remove(), 350)
  })

  ;[TONE_ID, LINES_ID, SPLASH_ID, IND_ID].forEach((id) => {
    document.getElementById(id)?.remove()
  })

  document.documentElement.classList.remove('manga-mode')
}

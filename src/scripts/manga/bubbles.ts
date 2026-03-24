type BubbleShape = 'oval' | 'spiky' | 'jagged'

interface BubbleDef {
  text: string
  shape: BubbleShape
  w: number
  h: number
  size: number
  fontSize: number
  tail?: 'left' | 'right'
}

const BUBBLE_DATA: BubbleDef[] = [
  { text: 'NANI?!', shape: 'oval', w: 260, h: 150, size: 260, fontSize: 18, tail: 'left' },
  { text: 'SUGOI!!', shape: 'spiky', w: 230, h: 230, size: 230, fontSize: 14 },
  { text: 'BAKA!!', shape: 'jagged', w: 250, h: 130, size: 250, fontSize: 18 },
  { text: 'やばい!', shape: 'oval', w: 220, h: 140, size: 220, fontSize: 26, tail: 'right' },
  { text: 'ARA ARA~', shape: 'oval', w: 290, h: 150, size: 290, fontSize: 14, tail: 'left' },
  { text: 'YAMETE!!', shape: 'spiky', w: 220, h: 220, size: 220, fontSize: 13 },
  { text: '最高!!', shape: 'jagged', w: 240, h: 130, size: 240, fontSize: 22 },
]

const POSITIONS: { top?: string; bottom?: string; left?: string; right?: string }[] = [
  { top: '8%', left: '2%' },
  { top: '5%', right: '2%' },
  { top: '42%', left: '1%' },
  { top: '52%', right: '1%' },
  { top: '78%', left: '3%' },
  { top: '25%', right: '2%' },
  { bottom: '8%', right: '3%' },
]

const ROTS = [-10, 8, -5, 9, -7, 6, -12]

function splitLines(text: string): string[] {
  const words = text.split(' ')
  if (words.length <= 2) return [text]
  return [
    words.slice(0, Math.ceil(words.length / 2)).join(' '),
    words.slice(Math.ceil(words.length / 2)).join(' '),
  ]
}

function renderTextLines(lines: string[], cx: number, cy: number, fontSize: number): string {
  const lineH = fontSize * 1.35
  return lines
    .map((l, i) => {
      const dy = cy - ((lines.length - 1) * lineH) / 2 + i * lineH
      return `<text x="${cx}" y="${dy}"
      text-anchor="middle" dominant-baseline="central"
      font-family="'Press Start 2P', monospace"
      font-size="${fontSize}" fill="#000" font-weight="bold">${l}</text>`
    })
    .join('')
}

function makeOvalSVG(
  text: string,
  w: number,
  h: number,
  fontSize: number,
  tailSide: 'left' | 'right' = 'left'
): string {
  const bodyH = h - 36
  const cx = w / 2
  const cy = bodyH / 2 + 4
  const rx = w / 2 - 6
  const ry = bodyH / 2 - 4
  const tailBase = tailSide === 'left' ? cx - 24 : cx + 24
  const tailTip = tailSide === 'left' ? 18 : w - 18
  const tipY = h - 4
  const textLines = renderTextLines(splitLines(text), cx, cy, fontSize)

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" stroke="black" stroke-width="4"/>
  <polygon points="${tailBase - 10},${cy + ry - 4} ${tailTip},${tipY} ${tailBase + 10},${cy + ry - 4}"
    fill="white" stroke="black" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white"/>
  ${textLines}
</svg>`
}

function makeSpikySVG(text: string, size: number, fontSize: number): string {
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * 0.62
  const points = 16
  let path = ''
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (i * Math.PI) / points - Math.PI / 2
    const x = (cx + Math.cos(angle) * r).toFixed(2)
    const y = (cy + Math.sin(angle) * r).toFixed(2)
    path += (i === 0 ? 'M' : 'L') + `${x},${y}`
  }
  path += 'Z'
  const lines = splitLines(text)
  const lineH = fontSize * 1.4
  const textLines = lines
    .map((l, i) => {
      const dy = cy - ((lines.length - 1) * lineH) / 2 + i * lineH
      return `<text x="${cx}" y="${dy}"
      text-anchor="middle" dominant-baseline="central"
      font-family="'Press Start 2P', monospace"
      font-size="${fontSize}" fill="#000" font-weight="bold">${l}</text>`
    })
    .join('')

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <path d="${path}" fill="white" stroke="black" stroke-width="3.5" stroke-linejoin="round"/>
  ${textLines}
</svg>`
}

function makeJaggedSVG(text: string, w: number, h: number, fontSize: number): string {
  const pad = 16
  const bodyH = h - 30
  const jag = 8
  let top = `M${pad},${jag} `
  for (let x = pad; x < w - pad; x += jag * 2) top += `L${x + jag},0 L${x + jag * 2},${jag} `
  const right = `L${w - pad},${bodyH} `
  let bot = ''
  for (let x = w - pad; x > pad; x -= jag * 2)
    bot += `L${x - jag},${bodyH + jag} L${x - jag * 2},${bodyH} `
  const jagPath = `${top}${right}${bot}L${pad},${jag}Z`
  const cx = w / 2
  const cy = bodyH / 2
  const textLines = renderTextLines(splitLines(text), cx, cy, fontSize)

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <path d="${jagPath}" fill="white" stroke="black" stroke-width="3.5" stroke-linejoin="round"/>
  <polygon points="${cx - 20},${bodyH} ${20},${h} ${cx + 20},${bodyH}"
    fill="white" stroke="black" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/>
  <path d="${jagPath}" fill="white"/>
  ${textLines}
</svg>`
}

export function injectBubbles(): void {
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

const SFX_DATA = [
  { text: 'DOOOM!', size: 28, top: '20%', left: '25%', rot: -8 },
  { text: 'KYAA~', size: 22, top: '65%', right: '20%', rot: 6 },
  { text: 'BWOOM', size: 24, bottom: '20%', left: '30%', rot: -5 },
] as const

export function injectBlush(): void {
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

export function injectSFX(): void {
  SFX_DATA.forEach((sfx, i) => {
    const el = document.createElement('div')
    el.classList.add('manga-sfx')
    el.style.setProperty('--rot', `${sfx.rot}deg`)
    el.style.fontSize = sfx.size + 'px'
    el.style.animationDelay = `${900 + i * 150}ms`
    if ('top' in sfx) el.style.top = sfx.top
    if ('bottom' in sfx) el.style.bottom = sfx.bottom
    if ('left' in sfx) el.style.left = sfx.left
    if ('right' in sfx) el.style.right = sfx.right
    el.textContent = sfx.text
    document.body.appendChild(el)
  })
}

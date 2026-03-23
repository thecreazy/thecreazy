/**
 * mangaMode.ts — orchestrator
 * Loaded 100% on-demand via dynamic import.
 * Zero cost until the Konami code is entered.
 */

import { STYLE_ID, TONE_ID, LINES_ID, SPLASH_ID, IND_ID, CSS } from './manga/constants'
import { injectBubbles } from './manga/bubbles'
import { injectBlush, injectSFX } from './manga/decorations'
import { drawSpeedLines } from './manga/speedLines'
import { showSplash } from './manga/splash'

export async function activate() {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
  }

  await showSplash()

  document.documentElement.classList.add('manga-mode')

  if (!document.getElementById(TONE_ID)) {
    const tone = document.createElement('div')
    tone.id = TONE_ID
    document.body.appendChild(tone)
  }

  drawSpeedLines()
  injectBubbles()
  injectBlush()
  injectSFX()

  if (!document.getElementById(IND_ID)) {
    const ind = document.createElement('div')
    ind.id = IND_ID
    ind.textContent = 'MANGA MODE'
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

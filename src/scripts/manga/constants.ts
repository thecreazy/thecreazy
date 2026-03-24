export const STYLE_ID = '__manga_styles__'
export const TONE_ID = '__manga_tone__'
export const LINES_ID = '__manga_lines__'
export const SPLASH_ID = '__manga_splash__'
export const IND_ID = '__manga_indicator__'

export const CSS = `
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

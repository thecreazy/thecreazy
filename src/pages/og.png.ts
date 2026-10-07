import type { APIRoute } from 'astro'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export const prerender = true

const font = (file: string) => readFileSync(resolve('./src/assets/fonts', file))

const INK = '#2a2430'
const FACE = '#f5f4f0'

// Flat rendering of the diamond: the slab rotated 45°, with the name ticker
// on the two front faces.
const W = 520
const CX = W / 2
const MID = 100 // y of the left/right corners
const BOTTOM = 2 * MID - 20 // y of the front corner
const THICK = 34
const H = BOTTOM + THICK + 2
const pts = (p: number[][]) => p.map(([x, y]) => `${x},${y}`).join(' ')

const topFace = [
  [CX, 20],
  [W - 20, MID],
  [CX, BOTTOM],
  [20, MID],
]
const leftFace = [
  [20, MID],
  [CX, BOTTOM],
  [CX, BOTTOM + THICK],
  [20, MID + THICK],
]
const rightFace = [
  [CX, BOTTOM],
  [W - 20, MID],
  [W - 20, MID + THICK],
  [CX, BOTTOM + THICK],
]

const SLOPE = Math.atan((BOTTOM - MID) / (CX - 20)) * (180 / Math.PI)
const FACE_W = CX - 20

// A side face's name ticker: a band of type sheared onto the face.
const ticker = (left: number, top: number, word: string, slope: number) => ({
  type: 'div',
  props: {
    style: {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${FACE_W}px`,
      height: `${THICK}px`,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      transform: `skewY(${slope}deg)`,
      transformOrigin: 'top left',
      fontFamily: 'display',
      fontSize: '25px',
      color: '#1a1a1a',
      whiteSpace: 'nowrap',
    },
    children: `${word}   ${word}   ${word}`,
  },
})

const diamond = {
  type: 'div',
  props: {
    style: { display: 'flex', position: 'relative', width: `${W}px`, height: `${H}px` },
    children: [
      {
        type: 'svg',
        props: {
          width: W,
          height: H,
          viewBox: `0 0 ${W} ${H}`,
          children: [
            {
              type: 'polygon',
              props: { points: pts(topFace), fill: FACE, stroke: INK, 'stroke-opacity': 0.25 },
            },
            {
              type: 'polygon',
              props: {
                points: pts(leftFace),
                fill: '#efece5',
                stroke: INK,
                'stroke-opacity': 0.25,
              },
            },
            {
              type: 'polygon',
              props: {
                points: pts(rightFace),
                fill: '#e8e4dc',
                stroke: INK,
                'stroke-opacity': 0.25,
              },
            },
          ],
        },
      },
      ticker(20, MID, 'RICCARDO', SLOPE),
      ticker(CX, BOTTOM, 'CANELLA', -SLOPE),
    ],
  },
}

export const GET: APIRoute = async () => {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f2eee6',
          backgroundImage: [
            'radial-gradient(circle at 15% 15%, rgba(232,136,192,0.35), rgba(232,136,192,0) 45%)',
            'radial-gradient(circle at 80% 10%, rgba(168,136,224,0.35), rgba(168,136,224,0) 40%)',
            'radial-gradient(circle at 75% 80%, rgba(120,216,168,0.35), rgba(120,216,168,0) 45%)',
            'radial-gradient(circle at 50% 50%, rgba(120,184,224,0.30), rgba(120,184,224,0) 55%)',
            'radial-gradient(circle at 10% 85%, rgba(200,152,224,0.35), rgba(200,152,224,0) 40%)',
          ].join(', '),
          color: INK,
          fontFamily: 'serif',
        },
        children: [
          diamond,
          {
            type: 'div',
            props: {
              style: {
                marginTop: '44px',
                fontFamily: 'mono',
                fontSize: '22px',
                letterSpacing: '2px',
                opacity: 0.7,
              },
              children: 'canellariccardo.it',
            },
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', marginTop: '8px', fontSize: '92px', lineHeight: 1 },
              children: [
                { type: 'span', props: { children: 'Riccardo ' } },
                { type: 'span', props: { style: { fontStyle: 'italic' }, children: 'Canella' } },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'serif', data: font('InstrumentSerif-Regular.ttf'), weight: 400, style: 'normal' },
        { name: 'serif', data: font('InstrumentSerif-Italic.ttf'), weight: 400, style: 'italic' },
        { name: 'mono', data: font('CourierPrime-Regular.ttf'), weight: 400, style: 'normal' },
        { name: 'display', data: font('ArchivoBlack-Regular.ttf'), weight: 400, style: 'normal' },
      ],
    }
  )

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = resvg.render().asPng()

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  })
}

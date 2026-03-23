import type { APIRoute } from 'astro'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export const prerender = true

const fontRegular = readFileSync(resolve('./public/font.woff'))
const fontTitle   = readFileSync(resolve('./public/title.woff'))

export const GET: APIRoute = async () => {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 80px',
          position: 'relative',
          fontFamily: 'mono',
        },
        children: [
          // halftone-style border accent
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: '#b6a8db',
              },
            },
          },
          // label
          {
            type: 'div',
            props: {
              style: {
                color: '#b6a8db',
                fontSize: '18px',
                letterSpacing: '4px',
                marginBottom: '24px',
                fontFamily: 'title',
              },
              children: '// canellariccardo.it',
            },
          },
          // name
          {
            type: 'div',
            props: {
              style: {
                color: '#e8e8e8',
                fontSize: '80px',
                lineHeight: '1',
                fontFamily: 'title',
                marginBottom: '20px',
              },
              children: 'Riccardo\nCanella',
            },
          },
          // role
          {
            type: 'div',
            props: {
              style: {
                color: '#999999',
                fontSize: '24px',
                fontFamily: 'mono',
                borderLeft: '3px solid #b6a8db',
                paddingLeft: '20px',
                marginTop: '8px',
              },
              children: 'Product Engineering Lead @ Hirematic',
            },
          },
          // bottom decorators
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '40px',
                right: '80px',
                color: '#2a2a2a',
                fontSize: '120px',
                fontFamily: 'title',
                lineHeight: '1',
              },
              children: '>_',
            },
          },
        ],
      },
    },
    {
      width:  1200,
      height: 630,
      fonts: [
        { name: 'mono',  data: fontRegular, weight: 400 },
        { name: 'title', data: fontTitle,   weight: 700 },
      ],
    },
  )

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png   = resvg.render().asPng()

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  })
}

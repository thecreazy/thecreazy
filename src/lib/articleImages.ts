import type { ImageMetadata } from 'astro'
import { join } from 'node:path'
import sharp from 'sharp'

// Cover images of the articles live in src/assets/articles, named after the
// slug of the article title (see slugify). The README stays the only source
// of the articles themselves; images are an optional, local companion.

const files = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/articles/*.{jpg,jpeg,png,webp}',
  { eager: true }
)

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface ArticleImage {
  image: ImageMetadata
  /** Absolute path of the source file, for build-time analysis. */
  file: string
}

export function articleImage(title: string): ArticleImage | undefined {
  const slug = slugify(title)
  const match = Object.entries(files).find(
    ([path]) => path.replace(/^.*\//, '').replace(/\.\w+$/, '') === slug
  )
  if (!match) return undefined
  const name = match[0].replace(/^.*\//, '')
  return { image: match[1].default, file: join(process.cwd(), 'src/assets/articles', name) }
}

export interface EdgeTones {
  top: 'light' | 'dark'
  bottom: 'light' | 'dark'
  left: 'light' | 'dark'
  right: 'light' | 'dark'
}

// Average luminance of the four edge strips the tickers run on: decides,
// side by side, whether the text over the photo should be light or dark.
export async function edgeTones(file: string): Promise<EdgeTones> {
  const { data, info } = await sharp(file)
    .resize(120, 63, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const lum = (x0: number, y0: number, x1: number, y1: number) => {
    let sum = 0
    let n = 0
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = (y * info.width + x) * info.channels
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        n++
      }
    return sum / n / 255
  }
  const tone = (l: number) => (l > 0.58 ? 'dark' : 'light')
  const w = info.width
  const h = info.height
  const band = Math.round(h * 0.12)

  return {
    top: tone(lum(0, 0, w, band)),
    bottom: tone(lum(0, h - band, w, h)),
    left: tone(lum(0, 0, band, h)),
    right: tone(lum(w - band, 0, w, h)),
  }
}

import type { ReadmeData, HeroData, SocialLink, Project, BlogPost, CVEntry } from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function stripEmoji(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractEmoji(text: string): string {
  const m = text.match(/^([\u{1F300}-\u{1FFFF}\u2600-\u27BF\s]+)/u)
  return m ? m[1].trim() : ''
}

// ─── section splitter ─────────────────────────────────────────────────────────

function splitSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {}
  let current = '__intro__'
  sections[current] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      current = line.replace('## ', '').trim().toLowerCase()
      sections[current] = []
    } else {
      sections[current].push(line)
    }
  }

  return sections
}

// ─── parsers ──────────────────────────────────────────────────────────────────

function parseHero(lines: string[]): HeroData {
  let name = ''
  let tagline = ''
  const bullets: string[] = []

  for (const line of lines) {
    if (line.startsWith('# ')) {
      name = line.replace('# ', '').trim()
    } else if (line.startsWith('### ')) {
      tagline = line.replace('### ', '').trim()
      // strip markdown links from tagline
      tagline = tagline.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    } else if (line.startsWith('- ')) {
      // strip markdown but keep content
      const bullet = line
        .replace(/^- /, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .trim()
      if (bullet) bullets.push(bullet)
    }
  }

  return { name, tagline, bullets }
}

function parseSocials(lines: string[]): SocialLink[] {
  const socials: SocialLink[] = []

  for (const line of lines) {
    const m = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (m) {
      socials.push({ label: m[1].trim(), url: m[2].trim() })
    }
  }

  return socials
}

function parseProjects(lines: string[]): Project[] {
  const projects: Project[] = []

  for (const line of lines) {
    if (!line.startsWith('- ')) continue
    const content = line.replace(/^- /, '').trim()
    const linkMatch = content.match(/\[([^\]]+)\]\(([^)]+)\)(.*)/)
    if (linkMatch) {
      projects.push({
        name: linkMatch[1].trim(),
        url: linkMatch[2].trim(),
        description: linkMatch[3].replace(/^[:\s–-]+/, '').trim(),
      })
    }
  }

  return projects
}

function parseBlog(lines: string[]): BlogPost[] {
  const posts: BlogPost[] = []
  let currentYear = 0

  for (const line of lines) {
    // Year line: "- 2025"
    const yearMatch = line.match(/^- (\d{4})\s*$/)
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1], 10)
      continue
    }

    // Post line: "  - [emoji Title](url)"
    if (line.match(/^\s{2,}- /) && currentYear) {
      const m = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (m) {
        const rawTitle = m[1].trim()
        const url = m[2].trim()
        const tag = extractEmoji(rawTitle)
        const title = stripEmoji(rawTitle)
        posts.push({ title, url, year: currentYear, tag })
      }
    }
  }

  return posts
}

function parseCV(lines: string[]): CVEntry[] {
  const entries: CVEntry[] = []

  for (const line of lines) {
    if (!line.startsWith('- ')) continue
    const content = line.replace(/^- /, '').trim()
    // Format: [Company](url) Role (period) OR plain text
    const withLink = content.match(/\[([^\]]+)\]\(([^)]+)\)\s+(.+)/)
    if (withLink) {
      const rest = withLink[3].trim()
      // Extract period like "(2022/Mar - present)" or "(2015/Feb - 2017/May)"
      const periodMatch = rest.match(/\(([^)]+)\)\s*$/)
      const period = periodMatch ? periodMatch[1] : ''
      const role = rest.replace(/\s*\([^)]+\)\s*$/, '').trim()
      entries.push({ company: withLink[1], url: withLink[2], role, period })
    } else {
      // plain line like "Very old and ugly tecnologies ..."
      const periodMatch = content.match(/\(([^)]+)\)\s*$/)
      const period = periodMatch ? periodMatch[1] : ''
      const company = content.replace(/\s*\([^)]+\)\s*$/, '').trim()
      if (company) entries.push({ company, role: '', period })
    }
  }

  return entries
}

// ─── main ─────────────────────────────────────────────────────────────────────

export function parseReadme(raw: string): ReadmeData {
  const lines = raw.split('\n')
  const sections = splitSections(lines)

  return {
    hero: parseHero(sections['__intro__'] ?? []),
    socials: parseSocials(sections['where you can find me:'] ?? []),
    projects: parseProjects(sections['what i code:'] ?? []),
    blog: parseBlog(sections['what i write:'] ?? []),
    cv: parseCV(sections['my cv:'] ?? []),
    raw,
  }
}

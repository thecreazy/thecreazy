export interface HeroData {
  name: string
  tagline: string
  bullets: string[]
}

export interface SocialLink {
  label: string
  url: string
}

export interface Project {
  name: string
  description: string
  url: string
}

export interface BlogPost {
  title: string
  url: string
  year: number
  tag: string
}

export interface CVEntry {
  company: string
  role: string
  period: string
  url?: string
}

export interface ReadmeData {
  hero: HeroData
  socials: SocialLink[]
  projects: Project[]
  blog: BlogPost[]
  cv: CVEntry[]
  raw: string
}

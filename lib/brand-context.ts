import { prisma } from '@/lib/prisma'

interface BrandProfile {
  brandName: string
  slogan: string | null
  description: string | null
  targetAudience: string | null
  brandValues: string[] | null
  tonality: string
  colors: { primary?: string; secondary?: string; accent?: string } | null
  industry: string | null
  primaryLanguage: string
  secondaryLanguage: string | null
  aiContext: string | null
}

let cachedBrand: BrandProfile | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 Minuten

export async function getBrandContext(): Promise<BrandProfile | null> {
  const now = Date.now()
  if (cachedBrand && now - cacheTime < CACHE_TTL) {
    return cachedBrand
  }

  try {
    const brand = await prisma.brandProfile.findUnique({
      where: { id: 'singleton' },
    })
    if (brand) {
      cachedBrand = {
        ...brand,
        brandValues: brand.brandValues as string[] | null,
        colors: brand.colors as BrandProfile['colors'],
      }
      cacheTime = now
    } else {
      cachedBrand = null
    }
    return cachedBrand
  } catch {
    return cachedBrand
  }
}

export function invalidateBrandCache() {
  cachedBrand = null
  cacheTime = 0
}

export function formatBrandSystemPrompt(brand: BrandProfile): string {
  const parts: string[] = []

  parts.push(`Du schreibst Content für die Marke "${brand.brandName}".`)

  if (brand.slogan) parts.push(`Slogan: "${brand.slogan}"`)
  if (brand.description) parts.push(`Markenbeschreibung: ${brand.description}`)
  if (brand.industry) parts.push(`Branche: ${brand.industry}`)
  if (brand.targetAudience) parts.push(`Zielgruppe: ${brand.targetAudience}`)
  if (brand.brandValues && brand.brandValues.length > 0) {
    parts.push(`Markenwerte: ${brand.brandValues.join(', ')}`)
  }
  parts.push(`Tonalität: ${brand.tonality}`)
  parts.push(`Sprache: ${brand.primaryLanguage === 'de' ? 'Deutsch' : brand.primaryLanguage === 'en' ? 'Englisch' : brand.primaryLanguage}`)

  if (brand.aiContext) {
    parts.push(`\nZusätzlicher Kontext:\n${brand.aiContext}`)
  }

  return parts.join('\n')
}

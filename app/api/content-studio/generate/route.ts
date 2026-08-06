import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'
import { getBrandContext, formatBrandSystemPrompt } from '@/lib/brand-context'

const CONTENT_PROMPTS: Record<string, (title: string, product: string | null, keyword: string | null, instructions: string | null, lang: string) => string> = {
  product_description: (title, product, keyword, instructions, lang) =>
    `Erstelle einen emotionalen Produkttext für:

Titel: ${title}
${product ? `Produkt: ${product}` : ''}
${keyword ? `Keyword: ${keyword}` : ''}
${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

Anforderungen:
- Emotionale Ansprache, die zum Kauf motiviert
- Unique Selling Points hervorheben
- Sensorische Beschreibungen (Geschmack, Textur, Aroma)
- Call-to-Action am Ende
- 200-400 Wörter
- Sprache: ${lang === 'de' ? 'Deutsch' : 'Englisch'}

Format: Markdown`,

  blog_article: (title, _product, keyword, instructions, lang) =>
    `Schreibe einen SEO-optimierten Blog-Artikel:

Titel: ${title}
${keyword ? `Hauptkeyword: ${keyword}` : ''}
${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

Anforderungen:
- Klare H2/H3-Struktur
- Meta-Description am Anfang (max 160 Zeichen)
- 1000-1500 Wörter
- Natürliche Keyword-Integration
- Leserfreundlich, informativ, actionable
- Sprache: ${lang === 'de' ? 'Deutsch' : 'Englisch'}

Format: Markdown`,

  recipe: (title, product, keyword, instructions, lang) =>
    `Erstelle ein detailliertes Rezept:

Titel: ${title}
${product ? `Hauptzutat/Produkt: ${product}` : ''}
${keyword ? `Keyword: ${keyword}` : ''}
${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

Anforderungen:
- Zutatenliste mit genauen Mengenangaben
- Schritt-für-Schritt Zubereitung
- Zubereitungszeit und Schwierigkeitsgrad
- Tipps und Variationen
- Nährwertinfos wenn relevant
- Sprache: ${lang === 'de' ? 'Deutsch' : 'Englisch'}

Format: Markdown`,

  landing_page: (title, product, keyword, instructions, lang) =>
    `Erstelle einen Landing-Page-Text:

Titel: ${title}
${product ? `Produkt/Angebot: ${product}` : ''}
${keyword ? `Keyword: ${keyword}` : ''}
${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

Anforderungen:
- Starke Headline + Subheadline
- Problem-Lösung-Struktur
- Social Proof Abschnitt
- Klarer Call-to-Action
- Bullet-Points für Vorteile
- Sprache: ${lang === 'de' ? 'Deutsch' : 'Englisch'}

Format: Markdown`,

  social_post: (title, product, keyword, instructions, lang) =>
    `Erstelle einen Social-Media-Post:

Thema: ${title}
${product ? `Produkt: ${product}` : ''}
${keyword ? `Keyword: ${keyword}` : ''}
${instructions ? `Zusätzliche Anweisungen: ${instructions}` : ''}

Anforderungen:
- Aufmerksamkeitsstarker Einstieg
- Passende Hashtags
- Emojis einsetzen
- Max. 2200 Zeichen
- Sprache: ${lang === 'de' ? 'Deutsch' : 'Englisch'}

Format: Plaintext mit Emojis und Hashtags`,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.contentId) {
      return NextResponse.json({ error: 'contentId erforderlich' }, { status: 400 })
    }

    const content = await prisma.productContent.findUnique({
      where: { id: body.contentId },
    })

    if (!content) {
      return NextResponse.json({ error: 'Content nicht gefunden' }, { status: 404 })
    }

    const promptFn = CONTENT_PROMPTS[content.contentType] || CONTENT_PROMPTS.blog_article
    const userPrompt = promptFn(content.title, content.productName, content.keyword, content.prompt, content.language)

    // Brand-Kontext laden
    const brand = await getBrandContext()
    let systemPrompt = 'Du bist ein erfahrener Content-Experte und Texter. Schreibe hochwertige, zielgruppengerechte Texte.'
    if (brand) {
      systemPrompt = `${formatBrandSystemPrompt(brand)}\n\n${systemPrompt}`
    }

    const result = await aiComplete({
      taskType: 'brand_content',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
    })

    await prisma.productContent.update({
      where: { id: content.id },
      data: {
        generatedContent: result.content,
        status: content.status === 'draft' ? 'draft' : content.status,
      },
    })

    return NextResponse.json({ content: result.content, provider: result.provider })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Content-Generierung fehlgeschlagen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

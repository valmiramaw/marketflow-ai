import { NextResponse } from 'next/server'
import { aiComplete } from '@/lib/ai/router'
import { getBrandContext, formatBrandSystemPrompt } from '@/lib/brand-context'

export async function POST() {
  try {
    const brand = await getBrandContext()
    let brandInfo = ''
    if (brand) {
      brandInfo = `\n\nMarken-Kontext:\n${formatBrandSystemPrompt(brand)}`
    }

    const result = await aiComplete({
      taskType: 'content_suggest',
      messages: [
        {
          role: 'user',
          content: `Generiere 5 konkrete Content-Vorschläge für Blog-Artikel und Landing Pages.${brandInfo}

Für jeden Vorschlag liefere:
1. Titel (SEO-optimiert)
2. Hauptkeyword
3. Content-Typ (blog oder landing)
4. Kurze Begründung (1-2 Sätze, warum dieses Thema relevant ist)

Antworte ausschließlich im folgenden JSON-Format:
[
  { "title": "...", "keyword": "...", "contentType": "blog", "reason": "..." },
  ...
]`,
        },
      ],
      systemPrompt: 'Du bist ein SEO- und Content-Strategie-Experte. Generiere datenbasierte Content-Vorschläge. Antworte ausschließlich mit validem JSON.',
      temperature: 0.7,
    })

    // JSON aus der Antwort extrahieren
    let suggestions
    try {
      const jsonMatch = result.content.match(/\[[\s\S]*\]/)
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      suggestions = []
    }

    return NextResponse.json({ suggestions, provider: result.provider })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vorschläge konnten nicht generiert werden'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

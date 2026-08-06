import { NextRequest, NextResponse } from 'next/server'
import { aiComplete } from '@/lib/ai/router'
import { getBrandContext, formatBrandSystemPrompt } from '@/lib/brand-context'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.subject) {
      return NextResponse.json({ error: 'Kampagnen-Name und Betreff erforderlich' }, { status: 400 })
    }

    const brand = await getBrandContext()
    let systemPrompt = 'Du bist ein E-Mail-Marketing-Experte. Erstelle überzeugende E-Mail-Texte mit klaren CTAs.'
    if (brand) {
      systemPrompt += '\n\n' + formatBrandSystemPrompt(brand)
      systemPrompt += '\n\nHalte die Tonalität konsistent mit der Markenidentität.'
    }

    const result = await aiComplete({
      taskType: 'email_generate',
      messages: [
        {
          role: 'user',
          content: `Erstelle einen E-Mail-Text für folgende Kampagne:

Kampagnen-Name: ${body.name}
Betreff: ${body.subject}
${body.instructions ? `Zusätzliche Anweisungen: ${body.instructions}` : ''}

Anforderungen:
- Kein HTML, nur reiner Text mit Absätzen
- Persönliche Ansprache
- Klarer Call-to-Action
- Optimierter Betreff-Vorschlag
- Professionell aber nahbar

Antworte als JSON:
{
  "subject": "Optimierter Betreff",
  "content": "Der E-Mail-Text"
}`,
        },
      ],
      systemPrompt,
      temperature: 0.7,
      jsonMode: true,
    })

    const parsed = JSON.parse(result.content)
    return NextResponse.json({
      subject: parsed.subject || body.subject,
      content: parsed.content || '',
    })
  } catch {
    return NextResponse.json({ error: 'Fehler bei der Generierung' }, { status: 500 })
  }
}

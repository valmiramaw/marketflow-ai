import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'
import { getBrandContext, formatBrandSystemPrompt } from '@/lib/brand-context'

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  instagram: 'Instagram: Visuell, Storytelling, bis zu 30 relevante Hashtags, Emoji-reich, max. 2200 Zeichen.',
  tiktok: 'TikTok: Trendy, kurz und knackig, Hook am Anfang, relevante Hashtags, jugendlicher Ton.',
  linkedin: 'LinkedIn: Professionell, Insights und Mehrwert, 3-5 Hashtags, Business-Ton.',
  facebook: 'Facebook: Community-orientiert, Fragen stellen, moderate Hashtags, persönlicher Ton.',
  twitter: 'Twitter/X: Kurz und prägnant, max. 280 Zeichen, 2-3 Hashtags, pointiert.',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.platform) {
      return NextResponse.json({ error: 'Plattform erforderlich' }, { status: 400 })
    }

    const brand = await getBrandContext()
    let systemPrompt = 'Du bist ein Social-Media-Experte. Erstelle ansprechende, plattform-optimierte Posts.'
    if (brand) {
      systemPrompt += '\n\n' + formatBrandSystemPrompt(brand)
    }

    let contentContext = ''
    if (body.productContentId) {
      const content = await prisma.productContent.findUnique({
        where: { id: body.productContentId },
      })
      if (content) {
        contentContext = `\nBasiere den Post auf diesem Content:\nTitel: ${content.title}\nProdukt: ${content.productName || 'Allgemein'}\nInhalt: ${content.generatedContent || content.prompt || 'Keine Details'}`
      }
    }

    const platformGuide = PLATFORM_INSTRUCTIONS[body.platform] || ''
    const topic = body.topic || ''

    const result = await aiComplete({
      taskType: 'social_generate',
      messages: [
        {
          role: 'user',
          content: `Erstelle einen Social-Media-Post für ${body.platform}.

${platformGuide}
${topic ? `\nThema/Anweisung: ${topic}` : ''}${contentContext}

Antworte als JSON:
{
  "content": "Der Post-Text",
  "hashtags": "Hashtags mit # getrennt durch Leerzeichen"
}`,
        },
      ],
      systemPrompt,
      temperature: 0.8,
      jsonMode: true,
    })

    const parsed = JSON.parse(result.content)
    return NextResponse.json({
      content: parsed.content || '',
      hashtags: parsed.hashtags || '',
    })
  } catch {
    return NextResponse.json({ error: 'Fehler bei der Generierung' }, { status: 500 })
  }
}

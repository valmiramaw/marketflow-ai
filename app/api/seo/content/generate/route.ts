import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.contentPlanId) {
      return NextResponse.json({ error: 'contentPlanId erforderlich' }, { status: 400 })
    }

    const plan = await prisma.contentPlan.findUnique({
      where: { id: body.contentPlanId },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Content-Plan nicht gefunden' }, { status: 404 })
    }

    const result = await aiComplete({
      taskType: 'seo_content',
      messages: [
        {
          role: 'user',
          content: `Erstelle einen SEO-optimierten ${plan.contentType === 'blog' ? 'Blog-Artikel' : plan.contentType === 'landing' ? 'Landing Page Text' : 'Produkttext'} zum Thema:

Titel: ${plan.title}
${plan.keyword ? `Hauptkeyword: ${plan.keyword}` : ''}
${plan.outline ? `Gliederung: ${plan.outline}` : ''}

Anforderungen:
- SEO-optimiert mit natürlicher Keyword-Integration
- Klare H2/H3 Struktur
- Leserfreundlich, informativ, actionable
- Meta-Description am Anfang (max 160 Zeichen)
- Ca. 1000-1500 Wörter
- Auf Deutsch

Format: Markdown`,
        },
      ],
      systemPrompt: 'Du bist ein SEO-Content-Experte. Schreibe hochwertige, suchmaschinenoptimierte Texte auf Deutsch.',
    })

    await prisma.contentPlan.update({
      where: { id: plan.id },
      data: {
        aiDraft: result.content,
        status: plan.status === 'idea' ? 'writing' : plan.status,
      },
    })

    return NextResponse.json({ content: result.content, provider: result.provider })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Content-Generierung fehlgeschlagen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

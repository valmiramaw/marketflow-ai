import { NextRequest, NextResponse } from 'next/server'
import { aiComplete } from '@/lib/ai/router'
import type { AiMessage } from '@/lib/ai/types'

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: AiMessage[] }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Keine Nachrichten' }, { status: 400 })
    }

    const result = await aiComplete({
      taskType: 'chat',
      messages,
      systemPrompt: `Du bist MarketFlow AI, ein erfahrener Marketing- und Sales-Assistent.
Du hilfst bei:
- Performance Marketing (Google Ads, Meta Ads): Budget-Optimierung, ROAS-Analyse, A/B Tests
- SEO & Analytics: Keyword-Strategie, Content-Planung, technisches SEO
- Sales Intelligence: Lead-Bewertung, Pipeline-Management, Proposal-Erstellung

Antworte auf Deutsch. Sei präzise, datengetrieben und actionable.
Wenn du konkrete Zahlen brauchst, die du nicht hast, frage nach.`,
    })

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
      tokens: result.tokens,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

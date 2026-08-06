import { NextRequest, NextResponse } from 'next/server'
import { aiComplete, aiCollaborate } from '@/lib/ai/router'
import type { AiMessage } from '@/lib/ai/types'

const SYSTEM_PROMPT = `Du bist MarketFlow AI, ein erfahrener Marketing- und Sales-Assistent.
Du hilfst bei:
- Performance Marketing (Google Ads, Meta Ads): Budget-Optimierung, ROAS-Analyse, A/B Tests
- SEO & Analytics: Keyword-Strategie, Content-Planung, technisches SEO
- Sales Intelligence: Lead-Bewertung, Pipeline-Management, Proposal-Erstellung

Antworte auf Deutsch. Sei präzise, datengetrieben und actionable.
Wenn du konkrete Zahlen brauchst, die du nicht hast, frage nach.`

export async function POST(request: NextRequest) {
  try {
    const { messages, mode } = (await request.json()) as {
      messages: AiMessage[]
      mode?: 'single' | 'collab'
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Keine Nachrichten' }, { status: 400 })
    }

    // Multi-KI Kollaboration
    if (mode === 'collab') {
      const result = await aiCollaborate({
        taskType: 'chat',
        messages,
        systemPrompt: SYSTEM_PROMPT,
      })

      return NextResponse.json({
        content: result.synthesis,
        perspectives: result.perspectives.map((p) => ({
          provider: p.provider,
          model: p.model,
          content: p.content,
          duration: p.duration,
        })),
        synthesizer: result.synthesizer,
        tokens: result.totalTokens,
        mode: 'collab',
        providerCount: result.perspectives.length,
      })
    }

    // Standard: Einzelner Provider mit Fallback
    const result = await aiComplete({
      taskType: 'chat',
      messages,
      systemPrompt: SYSTEM_PROMPT,
    })

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
      tokens: result.tokens,
      mode: 'single',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

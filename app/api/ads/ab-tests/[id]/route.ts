import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

// PATCH - A/B Test aktualisieren oder abschließen
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.status !== undefined) data.status = body.status
  if (body.winner !== undefined) data.winner = body.winner
  if (body.confidence !== undefined) data.confidence = body.confidence

  if (body.status === 'completed') {
    data.endedAt = new Date()
  }

  const test = await prisma.abTest.update({
    where: { id },
    data,
    include: {
      campaign: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(test)
}

// DELETE - A/B Test löschen
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.abTest.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

// POST - KI-Analyse eines A/B Tests
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const test = await prisma.abTest.findUnique({
    where: { id },
    include: { campaign: true },
  })

  if (!test) {
    return NextResponse.json({ error: 'Test nicht gefunden' }, { status: 404 })
  }

  const result = await aiComplete({
    taskType: 'data_extraction',
    messages: [
      {
        role: 'user',
        content: `Analysiere diesen A/B Test und gib ein JSON zurück:

Test: ${test.name}
Kampagne: ${test.campaign.name}
Status: ${test.status}
Gestartet: ${test.startedAt?.toISOString().split('T')[0]}

Variante A: ${JSON.stringify(test.variantA)}
Variante B: ${JSON.stringify(test.variantB)}

Antworte als JSON:
{
  "winner": "A" | "B" | "inconclusive",
  "confidence": 0-100,
  "analysis": "...",
  "recommendation": "..."
}`,
      },
    ],
    jsonMode: true,
    temperature: 0.3,
  })

  try {
    const analysis = JSON.parse(result.content)

    await prisma.abTest.update({
      where: { id },
      data: {
        aiAnalysis: result.content,
        winner: analysis.winner !== 'inconclusive' ? analysis.winner : null,
        confidence: analysis.confidence || null,
      },
    })

    return NextResponse.json(analysis)
  } catch {
    return NextResponse.json({ analysis: result.content })
  }
}

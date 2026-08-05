import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

// GET - Einzelnes Creative mit Analyse
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      adGroup: {
        include: {
          campaign: {
            select: { id: true, name: true, platform: true },
          },
        },
      },
    },
  })

  if (!ad) {
    return NextResponse.json({ error: 'Creative nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(ad)
}

// PATCH - Creative aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.headline !== undefined) data.headline = body.headline
  if (body.description !== undefined) data.description = body.description
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl
  if (body.landingUrl !== undefined) data.landingUrl = body.landingUrl
  if (body.status !== undefined) data.status = body.status
  if (body.type !== undefined) data.type = body.type

  const ad = await prisma.ad.update({
    where: { id },
    data,
  })

  return NextResponse.json(ad)
}

// DELETE - Creative löschen
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.ad.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

// POST - Gemini Vision Re-Analyse
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const ad = await prisma.ad.findUnique({ where: { id } })
  if (!ad) {
    return NextResponse.json({ error: 'Creative nicht gefunden' }, { status: 404 })
  }

  const result = await aiComplete({
    taskType: 'image_analysis',
    messages: [
      {
        role: 'user',
        content: `Analysiere dieses Werbemittel detailliert:

Typ: ${ad.type}
Headline: ${ad.headline || 'keine'}
Beschreibung: ${ad.description || 'keine'}
Bild: ${ad.imageUrl || 'kein Bild'}
Landing Page: ${ad.landingUrl || 'keine'}

Gib ein JSON zurück:
{
  "score": 0-100,
  "visualImpact": { "score": 0-100, "feedback": "..." },
  "textQuality": { "score": 0-100, "feedback": "..." },
  "callToAction": { "score": 0-100, "feedback": "..." },
  "improvements": ["...", "..."],
  "alternativeHeadlines": ["...", "...", "..."],
  "alternativeDescriptions": ["...", "..."]
}`,
      },
    ],
    jsonMode: true,
    temperature: 0.4,
  })

  await prisma.ad.update({
    where: { id },
    data: { aiAnalysis: result.content },
  })

  try {
    return NextResponse.json(JSON.parse(result.content))
  } catch {
    return NextResponse.json({ analysis: result.content })
  }
}

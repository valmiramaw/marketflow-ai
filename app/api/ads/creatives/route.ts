import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

// GET - Alle Ads (Creatives) auflisten
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  const where: Record<string, string> = {}
  if (type) where.type = type

  const ads = await prisma.ad.findMany({
    where,
    include: {
      adGroup: {
        include: {
          campaign: {
            select: { id: true, name: true, platform: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(ads)
}

// POST - Neues Creative erstellen + optional KI-Analyse
export async function POST(request: NextRequest) {
  const body = await request.json()

  // AdGroup muss existieren - falls nicht, erstellen wir eine Default-Gruppe
  let adGroupId = body.adGroupId

  if (!adGroupId && body.campaignId) {
    const defaultGroup = await prisma.adGroup.upsert({
      where: {
        id: `default-${body.campaignId}`,
      },
      create: {
        id: `default-${body.campaignId}`,
        campaignId: body.campaignId,
        name: 'Standard-Anzeigengruppe',
        status: 'active',
      },
      update: {},
    })
    adGroupId = defaultGroup.id
  }

  if (!adGroupId) {
    return NextResponse.json({ error: 'campaignId oder adGroupId erforderlich' }, { status: 400 })
  }

  const ad = await prisma.ad.create({
    data: {
      adGroupId,
      type: body.type || 'text',
      headline: body.headline || '',
      description: body.description || '',
      imageUrl: body.imageUrl || null,
      landingUrl: body.landingUrl || null,
      status: body.status || 'draft',
    },
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

  // KI-Analyse im Hintergrund (wenn Bild vorhanden, Gemini Vision)
  if (body.imageUrl && body.analyze) {
    analyzeCreative(ad.id, body.imageUrl, body.headline, body.description).catch(() => {})
  }

  return NextResponse.json(ad, { status: 201 })
}

// Gemini Vision Analyse für Werbemittel
async function analyzeCreative(
  adId: string,
  imageUrl: string,
  headline?: string,
  description?: string
) {
  const result = await aiComplete({
    taskType: 'image_analysis',
    messages: [
      {
        role: 'user',
        content: `Analysiere dieses Werbemittel (Creative) für eine Online-Kampagne.

Bild-URL: ${imageUrl}
Headline: ${headline || 'nicht angegeben'}
Beschreibung: ${description || 'nicht angegeben'}

Bewerte folgende Aspekte und gib ein JSON zurück:
{
  "score": 0-100,
  "visualImpact": { "score": 0-100, "feedback": "..." },
  "textQuality": { "score": 0-100, "feedback": "..." },
  "callToAction": { "score": 0-100, "feedback": "..." },
  "brandConsistency": { "score": 0-100, "feedback": "..." },
  "improvements": ["...", "..."],
  "alternativeHeadlines": ["...", "...", "..."]
}`,
      },
    ],
    jsonMode: true,
    temperature: 0.4,
  })

  await prisma.ad.update({
    where: { id: adId },
    data: { aiAnalysis: result.content },
  })
}

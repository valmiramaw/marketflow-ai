import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invalidateBrandCache } from '@/lib/brand-context'

export async function GET() {
  try {
    const brand = await prisma.brandProfile.findUnique({
      where: { id: 'singleton' },
    })
    return NextResponse.json(brand)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.brandName) {
      return NextResponse.json({ error: 'Markenname erforderlich' }, { status: 400 })
    }

    const brand = await prisma.brandProfile.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        brandName: body.brandName,
        slogan: body.slogan || null,
        description: body.description || null,
        targetAudience: body.targetAudience || null,
        brandValues: body.brandValues || null,
        tonality: body.tonality || 'professional',
        colors: body.colors || null,
        industry: body.industry || null,
        primaryLanguage: body.primaryLanguage || 'de',
        secondaryLanguage: body.secondaryLanguage || null,
        aiContext: body.aiContext || null,
      },
      update: {
        brandName: body.brandName,
        slogan: body.slogan || null,
        description: body.description || null,
        targetAudience: body.targetAudience || null,
        brandValues: body.brandValues || null,
        tonality: body.tonality || 'professional',
        colors: body.colors || null,
        industry: body.industry || null,
        primaryLanguage: body.primaryLanguage || 'de',
        secondaryLanguage: body.secondaryLanguage || null,
        aiContext: body.aiContext || null,
      },
    })

    invalidateBrandCache()
    return NextResponse.json(brand)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}

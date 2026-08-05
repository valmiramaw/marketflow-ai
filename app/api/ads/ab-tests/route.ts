import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Alle A/B Tests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const campaignId = searchParams.get('campaignId')

  const where: Record<string, string> = {}
  if (status) where.status = status
  if (campaignId) where.campaignId = campaignId

  const tests = await prisma.abTest.findMany({
    where,
    include: {
      campaign: {
        select: { id: true, name: true, platform: true },
      },
    },
    orderBy: { startedAt: 'desc' },
  })

  return NextResponse.json(tests)
}

// POST - Neuen A/B Test erstellen
export async function POST(request: NextRequest) {
  const body = await request.json()

  const test = await prisma.abTest.create({
    data: {
      campaignId: body.campaignId,
      name: body.name,
      status: 'running',
      variantA: body.variantA || {},
      variantB: body.variantB || {},
      startedAt: new Date(),
    },
    include: {
      campaign: {
        select: { id: true, name: true, platform: true },
      },
    },
  })

  return NextResponse.json(test, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Einzelne Kampagne mit Details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      adGroups: {
        include: {
          ads: true,
        },
      },
      metrics: {
        orderBy: { date: 'desc' },
        take: 30,
      },
      abTests: {
        orderBy: { startedAt: 'desc' },
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Kampagne nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(campaign)
}

// PATCH - Kampagne aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.status !== undefined) data.status = body.status
  if (body.objective !== undefined) data.objective = body.objective
  if (body.budget !== undefined) data.budget = parseFloat(body.budget)
  if (body.budgetType !== undefined) data.budgetType = body.budgetType
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
  if (body.aiScore !== undefined) data.aiScore = body.aiScore
  if (body.aiInsights !== undefined) data.aiInsights = body.aiInsights

  const campaign = await prisma.campaign.update({
    where: { id },
    data,
  })

  return NextResponse.json(campaign)
}

// DELETE - Kampagne löschen
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.campaign.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

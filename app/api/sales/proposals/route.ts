import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get('leadId')

  try {
    const where: Record<string, unknown> = {}
    if (leadId) where.leadId = leadId

    const proposals = await prisma.proposal.findMany({
      where,
      include: { lead: { select: { id: true, company: true, contactName: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(proposals)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

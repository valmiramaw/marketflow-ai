import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const snapshots = await prisma.analyticsSnapshot.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })
    return NextResponse.json(snapshots)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'singleton' },
    })

    if (!settings) {
      return NextResponse.json({
        anthropicKey: '',
        openaiKey: '',
        geminiKey: '',
        awsAccessKeyId: '',
        awsSecretAccessKey: '',
        awsRegion: '',
      })
    }

    return NextResponse.json({
      anthropicKey: settings.anthropicKey ? maskKey(settings.anthropicKey) : '',
      openaiKey: settings.openaiKey ? maskKey(settings.openaiKey) : '',
      geminiKey: settings.geminiKey ? maskKey(settings.geminiKey) : '',
      awsAccessKeyId: settings.awsAccessKeyId ? maskKey(settings.awsAccessKeyId) : '',
      awsSecretAccessKey: settings.awsSecretAccessKey ? maskKey(settings.awsSecretAccessKey) : '',
      awsRegion: settings.awsRegion || '',
    })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const data: Record<string, string | undefined> = {}

    // Nur aktualisieren wenn nicht maskiert (also neuer Wert)
    if (body.anthropicKey && !body.anthropicKey.includes('••••')) {
      data.anthropicKey = body.anthropicKey
    }
    if (body.openaiKey && !body.openaiKey.includes('••••')) {
      data.openaiKey = body.openaiKey
    }
    if (body.geminiKey && !body.geminiKey.includes('••••')) {
      data.geminiKey = body.geminiKey
    }
    if (body.awsAccessKeyId && !body.awsAccessKeyId.includes('••••')) {
      data.awsAccessKeyId = body.awsAccessKeyId
    }
    if (body.awsSecretAccessKey && !body.awsSecretAccessKey.includes('••••')) {
      data.awsSecretAccessKey = body.awsSecretAccessKey
    }
    // Region ist nicht geheim, immer speichern wenn vorhanden
    if (body.awsRegion !== undefined) {
      data.awsRegion = body.awsRegion || null
    }

    await prisma.appSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        ...data,
      },
      update: data,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••'
  return key.slice(0, 4) + '••••••••' + key.slice(-4)
}

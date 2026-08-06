import { prisma } from '@/lib/prisma'
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiCollaborationResponse,
  AiProvider,
  AiProviderClient,
} from './types'
import { TASK_PROVIDER_MAP } from './types'
import { ClaudeProvider } from './providers/claude'
import { OpenAiProvider } from './providers/openai'
import { GeminiProvider } from './providers/gemini'

interface AppKeys {
  anthropic: string | null
  openai: string | null
  gemini: string | null
  awsAccessKeyId: string | null
  awsSecretAccessKey: string | null
  awsRegion: string | null
}

async function getApiKeys(): Promise<AppKeys> {
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
    return {
      anthropic: settings?.anthropicKey || process.env.ANTHROPIC_API_KEY || null,
      openai: settings?.openaiKey || process.env.OPENAI_API_KEY || null,
      gemini: settings?.geminiKey || process.env.GEMINI_API_KEY || null,
      awsAccessKeyId: settings?.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID || null,
      awsSecretAccessKey: settings?.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || null,
      awsRegion: settings?.awsRegion || process.env.AWS_REGION || null,
    }
  } catch {
    return {
      anthropic: process.env.ANTHROPIC_API_KEY || null,
      openai: process.env.OPENAI_API_KEY || null,
      gemini: process.env.GEMINI_API_KEY || null,
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || null,
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || null,
      awsRegion: process.env.AWS_REGION || null,
    }
  }
}

async function getProviders(): Promise<Record<AiProvider, AiProviderClient>> {
  const keys = await getApiKeys()
  return {
    claude: new ClaudeProvider(keys.anthropic || undefined, {
      accessKeyId: keys.awsAccessKeyId || undefined,
      secretAccessKey: keys.awsSecretAccessKey || undefined,
      region: keys.awsRegion || undefined,
    }),
    openai: new OpenAiProvider(keys.openai || undefined),
    gemini: new GeminiProvider(keys.gemini || undefined),
  }
}

function getFallbackOrder(preferred: AiProvider): AiProvider[] {
  const order: AiProvider[] = ['claude', 'openai', 'gemini']
  return [preferred, ...order.filter((p) => p !== preferred)]
}

// Einzelner Provider mit automatischem Fallback bei Fehlern
export async function aiComplete(
  request: AiCompletionRequest
): Promise<AiCompletionResponse> {
  const allProviders = await getProviders()
  const preferredProvider = request.forceProvider || TASK_PROVIDER_MAP[request.taskType]
  const fallbackOrder = getFallbackOrder(preferredProvider)

  const configuredProviders = fallbackOrder.filter((p) => allProviders[p].isConfigured())

  if (configuredProviders.length === 0) {
    throw new Error(
      'Kein KI-Provider konfiguriert. Bitte mindestens einen API-Key in den Einstellungen hinterlegen.'
    )
  }

  // Versuche jeden konfigurierten Provider, Fallback bei Fehler
  let lastError: Error | null = null
  for (const provider of configuredProviders) {
    try {
      const response = await allProviders[provider].complete(request)
      logUsage(response, request.taskType).catch(() => {})
      return response
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      logError(provider, request.taskType, lastError.message).catch(() => {})
      // Weiter zum nächsten Provider
    }
  }

  throw new Error(
    `Alle KI-Provider fehlgeschlagen. Letzter Fehler: ${lastError?.message || 'Unbekannt'}`
  )
}

// Multi-KI Kollaboration: Alle verfügbaren KIs arbeiten zusammen
export async function aiCollaborate(
  request: AiCompletionRequest
): Promise<AiCollaborationResponse> {
  const allProviders = await getProviders()
  const configuredProviders: AiProvider[] = (['claude', 'openai', 'gemini'] as AiProvider[])
    .filter((p) => allProviders[p].isConfigured())

  if (configuredProviders.length === 0) {
    throw new Error('Kein KI-Provider konfiguriert.')
  }

  // Wenn nur 1 Provider verfügbar → normaler Call
  if (configuredProviders.length === 1) {
    const response = await allProviders[configuredProviders[0]].complete(request)
    logUsage(response, request.taskType).catch(() => {})
    return {
      synthesis: response.content,
      perspectives: [{
        provider: response.provider,
        model: response.model,
        content: response.content,
        tokens: response.tokens,
        duration: response.duration,
      }],
      synthesizer: response.provider,
      totalTokens: response.tokens,
      totalDuration: response.duration,
    }
  }

  // Alle Provider parallel abfragen
  const perspectivePromises = configuredProviders.map(async (provider) => {
    try {
      const response = await allProviders[provider].complete({
        ...request,
        forceProvider: provider,
        systemPrompt: request.systemPrompt
          ? `${request.systemPrompt}\n\nGib deine beste, einzigartige Perspektive. Sei konkret und praxisnah.`
          : 'Du bist ein erfahrener Marketing- und Sales-Experte. Gib deine beste, einzigartige Perspektive. Sei konkret und praxisnah. Antworte auf Deutsch.',
      })
      logUsage(response, request.taskType).catch(() => {})
      return {
        provider: response.provider,
        model: response.model,
        content: response.content,
        tokens: response.tokens,
        duration: response.duration,
        success: true as const,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logError(provider, request.taskType, msg).catch(() => {})
      return {
        provider,
        model: '',
        content: '',
        tokens: { input: 0, output: 0 },
        duration: 0,
        success: false as const,
      }
    }
  })

  const results = await Promise.all(perspectivePromises)
  const successful = results.filter((r) => r.success)

  if (successful.length === 0) {
    throw new Error('Alle KI-Provider fehlgeschlagen.')
  }

  // Wenn nur 1 erfolgreich → direkt zurückgeben
  if (successful.length === 1) {
    return {
      synthesis: successful[0].content,
      perspectives: successful.map((r) => ({
        provider: r.provider,
        model: r.model,
        content: r.content,
        tokens: r.tokens,
        duration: r.duration,
      })),
      synthesizer: successful[0].provider,
      totalTokens: successful[0].tokens,
      totalDuration: successful[0].duration,
    }
  }

  // Synthese erstellen: Ein Provider kombiniert alle Perspektiven
  const synthesizer = successful[0] // Besten verfügbaren nehmen
  const perspectiveTexts = successful.map((r) => {
    const name = r.provider === 'claude' ? 'Claude' : r.provider === 'openai' ? 'GPT-4o' : 'Gemini'
    return `### ${name} Perspektive:\n${r.content}`
  }).join('\n\n---\n\n')

  const synthesisRequest: AiCompletionRequest = {
    taskType: request.taskType,
    forceProvider: synthesizer.provider,
    messages: [{
      role: 'user',
      content: `Du hast mehrere KI-Perspektiven zu einer Frage erhalten. Erstelle eine optimale Synthese, die das Beste aus jeder Perspektive vereint.

URSPRÜNGLICHE FRAGE:
${request.messages[request.messages.length - 1]?.content || ''}

KI-PERSPEKTIVEN:
${perspectiveTexts}

AUFGABE:
1. Identifiziere die stärksten Ideen und Insights aus jeder Perspektive
2. Kombiniere sie zu einer kohärenten, umfassenden Antwort
3. Markiere Widersprüche oder unterschiedliche Meinungen
4. Gib am Ende eine klare Handlungsempfehlung

Antworte auf Deutsch. Formatiere gut lesbar mit Überschriften und Aufzählungen.`,
    }],
    systemPrompt: 'Du bist ein Meta-Analyst, der verschiedene KI-Perspektiven zu einer optimalen Synthese zusammenführt. Dein Ziel: Das Beste aus jeder Perspektive vereinen und eine umfassende, actionable Antwort erstellen.',
    temperature: 0.4,
  }

  try {
    const synthesisResponse = await allProviders[synthesizer.provider].complete(synthesisRequest)
    logUsage(synthesisResponse, 'chat').catch(() => {})

    const totalInput = successful.reduce((s, r) => s + r.tokens.input, 0) + synthesisResponse.tokens.input
    const totalOutput = successful.reduce((s, r) => s + r.tokens.output, 0) + synthesisResponse.tokens.output
    const totalDuration = successful.reduce((s, r) => s + r.duration, 0) + synthesisResponse.duration

    return {
      synthesis: synthesisResponse.content,
      perspectives: successful.map((r) => ({
        provider: r.provider,
        model: r.model,
        content: r.content,
        tokens: r.tokens,
        duration: r.duration,
      })),
      synthesizer: synthesizer.provider,
      totalTokens: { input: totalInput, output: totalOutput },
      totalDuration,
    }
  } catch {
    // Synthese fehlgeschlagen → Erste Perspektive als Fallback
    return {
      synthesis: successful[0].content,
      perspectives: successful.map((r) => ({
        provider: r.provider,
        model: r.model,
        content: r.content,
        tokens: r.tokens,
        duration: r.duration,
      })),
      synthesizer: successful[0].provider,
      totalTokens: {
        input: successful.reduce((s, r) => s + r.tokens.input, 0),
        output: successful.reduce((s, r) => s + r.tokens.output, 0),
      },
      totalDuration: successful.reduce((s, r) => s + r.duration, 0),
    }
  }
}

async function logUsage(response: AiCompletionResponse, taskType: string) {
  try {
    await prisma.aiUsageLog.create({
      data: {
        provider: response.provider,
        model: response.model,
        taskType,
        tokens: response.tokens.input + response.tokens.output,
        duration: response.duration,
        success: true,
      },
    })
  } catch {
    // Silently ignore
  }
}

async function logError(provider: string, taskType: string, error: string) {
  try {
    await prisma.aiUsageLog.create({
      data: {
        provider,
        model: 'error',
        taskType,
        tokens: 0,
        duration: 0,
        success: false,
        error,
      },
    })
  } catch {
    // Silently ignore
  }
}

export { getApiKeys }

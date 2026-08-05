import { prisma } from '@/lib/prisma'
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProvider,
  AiProviderClient,
} from './types'
import { TASK_PROVIDER_MAP } from './types'
import { ClaudeProvider } from './providers/claude'
import { OpenAiProvider } from './providers/openai'
import { GeminiProvider } from './providers/gemini'

// Provider-Instanzen (lazy init)
let providers: Record<AiProvider, AiProviderClient> | null = null

async function getApiKeys(): Promise<Record<string, string | null>> {
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
    return {
      anthropic: settings?.anthropicKey || process.env.ANTHROPIC_API_KEY || null,
      openai: settings?.openaiKey || process.env.OPENAI_API_KEY || null,
      gemini: settings?.geminiKey || process.env.GEMINI_API_KEY || null,
    }
  } catch {
    return {
      anthropic: process.env.ANTHROPIC_API_KEY || null,
      openai: process.env.OPENAI_API_KEY || null,
      gemini: process.env.GEMINI_API_KEY || null,
    }
  }
}

async function getProviders(): Promise<Record<AiProvider, AiProviderClient>> {
  const keys = await getApiKeys()
  // Immer neu erstellen um aktuelle Keys zu nutzen
  providers = {
    claude: new ClaudeProvider(keys.anthropic || undefined),
    openai: new OpenAiProvider(keys.openai || undefined),
    gemini: new GeminiProvider(keys.gemini || undefined),
  }
  return providers
}

function getFallbackOrder(preferred: AiProvider): AiProvider[] {
  const order: AiProvider[] = ['claude', 'openai', 'gemini']
  return [preferred, ...order.filter((p) => p !== preferred)]
}

export async function aiComplete(
  request: AiCompletionRequest
): Promise<AiCompletionResponse> {
  const allProviders = await getProviders()

  // Provider bestimmen
  const preferredProvider = request.forceProvider || TASK_PROVIDER_MAP[request.taskType]
  const fallbackOrder = getFallbackOrder(preferredProvider)

  // Ersten konfigurierten Provider nutzen
  let usedProvider: AiProvider | null = null
  let client: AiProviderClient | null = null

  for (const p of fallbackOrder) {
    if (allProviders[p].isConfigured()) {
      usedProvider = p
      client = allProviders[p]
      break
    }
  }

  if (!client || !usedProvider) {
    throw new Error(
      'Kein KI-Provider konfiguriert. Bitte mindestens einen API-Key in den Einstellungen hinterlegen.'
    )
  }

  const response = await client.complete(request)

  // Usage loggen (fire-and-forget)
  logUsage(response, request.taskType).catch(() => {})

  return response
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
    // Silently ignore logging errors
  }
}

export { getApiKeys }

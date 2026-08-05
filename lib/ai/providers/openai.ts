import OpenAI from 'openai'
import type { AiCompletionRequest, AiCompletionResponse, AiProviderClient } from '../types'

export class OpenAiProvider implements AiProviderClient {
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || null
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) throw new Error('OpenAI API Key nicht konfiguriert')

    const client = new OpenAI({ apiKey: this.apiKey })
    const start = Date.now()

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt })
    } else {
      messages.push({
        role: 'system',
        content: 'Du bist ein erfahrener Marketing- und Sales-Datenanalyst. Antworte auf Deutsch.',
      })
    }

    for (const m of request.messages) {
      if (m.role === 'system') continue
      messages.push({ role: m.role, content: m.content })
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens || 4096,
      ...(request.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      content,
      provider: 'openai',
      model: 'gpt-4o',
      tokens: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
      duration: Date.now() - start,
    }
  }
}

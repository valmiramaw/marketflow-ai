import Anthropic from '@anthropic-ai/sdk'
import type { AiCompletionRequest, AiCompletionResponse, AiProviderClient } from '../types'

export class ClaudeProvider implements AiProviderClient {
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || null
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) throw new Error('Anthropic API Key nicht konfiguriert')

    const client = new Anthropic({ apiKey: this.apiKey })
    const start = Date.now()

    const systemPrompt = request.systemPrompt || 'Du bist ein erfahrener Marketing- und Sales-Experte. Antworte auf Deutsch.'

    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
      system: systemPrompt,
      messages,
    })

    const textContent = response.content.find((c) => c.type === 'text')
    const content = textContent ? textContent.text : ''

    return {
      content,
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      duration: Date.now() - start,
    }
  }
}

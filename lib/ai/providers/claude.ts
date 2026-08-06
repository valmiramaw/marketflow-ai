import Anthropic from '@anthropic-ai/sdk'
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk'
import type { AiCompletionRequest, AiCompletionResponse, AiProviderClient } from '../types'

export class ClaudeProvider implements AiProviderClient {
  private apiKey: string | null
  private awsAccessKeyId: string | null
  private awsSecretAccessKey: string | null
  private awsRegion: string

  constructor(
    apiKey?: string,
    awsCredentials?: { accessKeyId?: string; secretAccessKey?: string; region?: string }
  ) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || null
    this.awsAccessKeyId = awsCredentials?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || null
    this.awsSecretAccessKey = awsCredentials?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || null
    this.awsRegion = awsCredentials?.region || process.env.AWS_REGION || 'eu-central-1'
  }

  private get useBedrock(): boolean {
    return !!(this.awsAccessKeyId && this.awsSecretAccessKey)
  }

  isConfigured(): boolean {
    return !!this.apiKey || this.useBedrock
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    // Bedrock bevorzugen wenn konfiguriert
    if (this.useBedrock) {
      return this.completeBedrock(request)
    }

    if (!this.apiKey) throw new Error('Anthropic API Key nicht konfiguriert')
    return this.completeDirect(request)
  }

  private async completeDirect(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const client = new Anthropic({ apiKey: this.apiKey! })
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

  private async completeBedrock(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const client = new AnthropicBedrock({
      awsAccessKey: this.awsAccessKeyId!,
      awsSecretKey: this.awsSecretAccessKey!,
      awsRegion: this.awsRegion,
    })
    const start = Date.now()

    const systemPrompt = request.systemPrompt || 'Du bist ein erfahrener Marketing- und Sales-Experte. Antworte auf Deutsch.'

    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    // Bedrock Model ID für Claude Sonnet
    const bedrockModel = 'anthropic.claude-sonnet-4-20250514-v1:0'

    const response = await client.messages.create({
      model: bedrockModel,
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
      model: `bedrock/${bedrockModel}`,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      duration: Date.now() - start,
    }
  }
}

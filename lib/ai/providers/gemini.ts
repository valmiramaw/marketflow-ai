import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AiCompletionRequest, AiCompletionResponse, AiProviderClient } from '../types'

export class GeminiProvider implements AiProviderClient {
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || null
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) throw new Error('Gemini API Key nicht konfiguriert')

    const genAI = new GoogleGenerativeAI(this.apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const start = Date.now()

    const systemInstruction =
      request.systemPrompt || 'Du bist ein erfahrener Marketing-Experte mit Fokus auf visuelle Analyse. Antworte auf Deutsch.'

    // Gemini nutzt ein anderes Message-Format
    const history = request.messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }))

    const lastMessage = request.messages[request.messages.length - 1]

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: request.temperature ?? 0.5,
        maxOutputTokens: request.maxTokens || 4096,
        ...(request.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
      systemInstruction: { role: 'user' as const, parts: [{ text: systemInstruction }] },
    })

    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response
    const content = response.text()

    // Gemini gibt keine exakten Token-Zahlen wie OpenAI zurück
    const usage = response.usageMetadata
    return {
      content,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      tokens: {
        input: usage?.promptTokenCount || 0,
        output: usage?.candidatesTokenCount || 0,
      },
      duration: Date.now() - start,
    }
  }
}

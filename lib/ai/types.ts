export type AiProvider = 'claude' | 'openai' | 'gemini'

export type TaskType =
  // Claude - Reasoning & Kreativität
  | 'content_generation'
  | 'strategy_analysis'
  | 'report_generation'
  | 'proposal_writing'
  | 'seo_content'
  | 'brand_content'
  | 'content_suggest'
  // OpenAI - Strukturierte Daten
  | 'lead_scoring'
  | 'data_extraction'
  | 'json_generation'
  | 'classification'
  | 'keyword_analysis'
  // Gemini - Vision & Bulk
  | 'image_analysis'
  | 'bulk_analysis'
  | 'creative_review'
  // Auto
  | 'chat'

export interface AiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AiCompletionRequest {
  taskType: TaskType
  messages: AiMessage[]
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  // Override auto-routing
  forceProvider?: AiProvider
}

export interface AiCompletionResponse {
  content: string
  provider: AiProvider
  model: string
  tokens: { input: number; output: number }
  duration: number
}

// Multi-KI Kollaboration
export interface AiCollaborationResponse {
  synthesis: string
  perspectives: {
    provider: AiProvider
    model: string
    content: string
    tokens: { input: number; output: number }
    duration: number
  }[]
  synthesizer: AiProvider
  totalTokens: { input: number; output: number }
  totalDuration: number
}

export interface AiProviderClient {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>
  isConfigured(): boolean
}

// Task → Provider Mapping
export const TASK_PROVIDER_MAP: Record<TaskType, AiProvider> = {
  // Claude
  content_generation: 'claude',
  strategy_analysis: 'claude',
  report_generation: 'claude',
  proposal_writing: 'claude',
  seo_content: 'claude',
  brand_content: 'claude',
  content_suggest: 'claude',
  // OpenAI
  lead_scoring: 'openai',
  data_extraction: 'openai',
  json_generation: 'openai',
  classification: 'openai',
  keyword_analysis: 'openai',
  // Gemini
  image_analysis: 'gemini',
  bulk_analysis: 'gemini',
  creative_review: 'gemini',
  // Auto → Claude als Default
  chat: 'claude',
}

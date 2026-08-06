'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Send, Bot, User, Sparkles, Loader2,
  Brain, Zap, ChevronDown, ChevronUp,
  Plus, Trash2, MessageSquare, PanelLeftClose, PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Perspective {
  provider: string
  model: string
  content: string
  duration: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  provider?: string
  model?: string
  mode?: 'single' | 'collab'
  perspectives?: Perspective[]
  synthesizer?: string
  providerCount?: number
}

interface Conversation {
  id: string
  title: string
  module: string
  createdAt: string
  updatedAt: string
}

const PROVIDER_COLORS: Record<string, string> = {
  claude: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  openai: 'bg-green-500/10 text-green-600 border-green-500/30',
  gemini: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
}

const PROVIDER_NAMES: Record<string, string> = {
  claude: 'Claude',
  openai: 'GPT-4o',
  gemini: 'Gemini',
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [collabMode, setCollabMode] = useState(false)
  const [expandedPerspectives, setExpandedPerspectives] = useState<Record<number, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  async function fetchConversations() {
    try {
      const res = await fetch('/api/ai/conversations')
      if (res.ok) setConversations(await res.json())
    } catch { /* ignore */ } finally {
      setLoadingConversations(false)
    }
  }

  // Auto-save messages (debounced)
  const saveConversation = useCallback(async (msgs: Message[], convId: string | null) => {
    if (msgs.length === 0) return

    const title = msgs[0]?.content?.slice(0, 60) || 'Neuer Chat'

    try {
      const res = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: convId,
          title,
          messages: msgs,
          module: 'chat',
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        if (!convId) {
          setActiveConversationId(saved.id)
        }
        // Refresh list
        fetchConversations()
        return saved.id
      }
    } catch { /* ignore */ }
    return convId
  }, [])

  function scheduleSave(msgs: Message[], convId: string | null) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveConversation(msgs, convId)
    }, 1000)
  }

  async function loadConversation(conv: Conversation) {
    try {
      const res = await fetch('/api/ai/conversations')
      if (!res.ok) return

      // We need the full conversation with messages - fetch via a separate call
      const fullRes = await fetch(`/api/ai/conversations/${conv.id}`)
      if (fullRes.ok) {
        const data = await fullRes.json()
        setMessages(data.messages || [])
        setActiveConversationId(conv.id)
        setExpandedPerspectives({})
      }
    } catch { /* ignore */ }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await fetch('/api/ai/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeConversationId === id) {
        setActiveConversationId(null)
        setMessages([])
      }
    } catch { /* ignore */ }
  }

  function startNewChat() {
    setActiveConversationId(null)
    setMessages([])
    setExpandedPerspectives({})
    setInput('')
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mode: collabMode ? 'collab' : 'single',
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        const errorMessages = [
          ...newMessages,
          { role: 'assistant' as const, content: `Fehler: ${error.error || 'Unbekannter Fehler'}` },
        ]
        setMessages(errorMessages)
        scheduleSave(errorMessages, activeConversationId)
        return
      }

      const data = await res.json()
      const allMessages = [
        ...newMessages,
        {
          role: 'assistant' as const,
          content: data.content,
          provider: data.provider,
          model: data.model,
          mode: data.mode,
          perspectives: data.perspectives,
          synthesizer: data.synthesizer,
          providerCount: data.providerCount,
        },
      ]
      setMessages(allMessages)
      scheduleSave(allMessages, activeConversationId)
    } catch {
      const errorMessages = [
        ...newMessages,
        { role: 'assistant' as const, content: 'Verbindungsfehler. Bitte versuche es erneut.' },
      ]
      setMessages(errorMessages)
      scheduleSave(errorMessages, activeConversationId)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function togglePerspective(index: number) {
    setExpandedPerspectives((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div className={cn(
        'flex flex-col border rounded-lg bg-card transition-all duration-200',
        sidebarOpen ? 'w-72 min-w-[18rem]' : 'w-0 min-w-0 overflow-hidden border-0'
      )}>
        {sidebarOpen && (
          <>
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-medium">Chats</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewChat}>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen(false)}>
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConversations ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Keine gespeicherten Chats</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={cn(
                      'w-full text-left p-2 rounded-md text-sm group flex items-start justify-between gap-1 transition-colors',
                      activeConversationId === conv.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(conv.updatedAt).toLocaleDateString('de-DE', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)}>
                <PanelLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold">KI-Assistent</h1>
              <p className="text-muted-foreground mt-1">
                Multi-KI Marketing- & Sales-Assistent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startNewChat} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />Neuer Chat
            </Button>
            {/* Kollaboration Toggle */}
            <button
              onClick={() => setCollabMode(!collabMode)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium',
                collabMode
                  ? 'bg-gradient-to-r from-orange-500/10 via-green-500/10 to-blue-500/10 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {collabMode ? (
                <>
                  <Brain className="w-4 h-4" />
                  Multi-KI Aktiv
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Einzelne KI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collab Info */}
        {collabMode && (
          <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/5 via-green-500/5 to-blue-500/5 border border-primary/20 text-sm">
            <span className="font-medium">Multi-KI Modus:</span>{' '}
            Claude, GPT-4o und Gemini arbeiten zusammen. Jede KI gibt ihre Perspektive,
            dann werden die besten Ideen kombiniert.
          </div>
        )}

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">MarketFlow KI-Assistent</h2>
                  <p className="text-muted-foreground mt-1 max-w-md">
                    Frage mich zu Ads-Performance, SEO-Strategien, Lead-Bewertung
                    oder lass dir Reports und Content generieren.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {[
                    'Analysiere meine Ad-Performance diese Woche',
                    'Erstelle eine SEO-Content-Strategie für Q3',
                    'Bewerte den Lead "TechCorp GmbH"',
                    'Generiere einen Wochenbericht',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-left text-sm p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      msg.mode === 'collab'
                        ? 'bg-gradient-to-br from-orange-500 via-green-500 to-blue-500'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    )}>
                      {msg.mode === 'collab' ? (
                        <Brain className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg p-3',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Provider Badges */}
                    {msg.role === 'assistant' && (msg.provider || msg.mode === 'collab') && (
                      <div className="mt-2 flex flex-wrap gap-1 items-center">
                        {msg.mode === 'collab' && msg.perspectives ? (
                          <>
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-gradient-to-r from-orange-500/10 to-blue-500/10"
                            >
                              Multi-KI ({msg.providerCount} Provider)
                            </Badge>
                            {msg.perspectives.map((p) => (
                              <Badge
                                key={p.provider}
                                variant="outline"
                                className={cn('text-[10px]', PROVIDER_COLORS[p.provider])}
                              >
                                {PROVIDER_NAMES[p.provider] || p.provider}
                              </Badge>
                            ))}
                            {msg.synthesizer && (
                              <Badge variant="outline" className="text-[10px]">
                                Synthese: {PROVIDER_NAMES[msg.synthesizer] || msg.synthesizer}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <>
                            <Badge
                              variant="outline"
                              className={cn('text-[10px]', PROVIDER_COLORS[msg.provider || ''])}
                            >
                              {PROVIDER_NAMES[msg.provider || ''] || msg.provider}
                            </Badge>
                            {msg.model && (
                              <Badge variant="outline" className="text-[10px]">
                                {msg.model}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Einzelne Perspektiven (aufklappbar) */}
                {msg.mode === 'collab' && msg.perspectives && msg.perspectives.length > 1 && (
                  <div className="ml-11 mt-2">
                    <button
                      onClick={() => togglePerspective(i)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedPerspectives[i] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      Einzelne KI-Perspektiven anzeigen ({msg.perspectives.length})
                    </button>

                    {expandedPerspectives[i] && (
                      <div className="mt-2 space-y-2">
                        {msg.perspectives.map((p) => (
                          <div
                            key={p.provider}
                            className={cn(
                              'rounded-lg p-3 border text-sm',
                              PROVIDER_COLORS[p.provider]
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2 font-medium">
                              <div className={cn(
                                'w-2 h-2 rounded-full',
                                p.provider === 'claude' ? 'bg-orange-500'
                                  : p.provider === 'openai' ? 'bg-green-500'
                                  : 'bg-blue-500'
                              )} />
                              {PROVIDER_NAMES[p.provider]} ({p.model})
                              <span className="text-[10px] opacity-60">{(p.duration / 1000).toFixed(1)}s</span>
                            </div>
                            <p className="whitespace-pre-wrap text-foreground text-xs leading-relaxed">
                              {p.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  collabMode
                    ? 'bg-gradient-to-br from-orange-500 via-green-500 to-blue-500'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                )}>
                  {collabMode ? (
                    <Brain className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {collabMode ? 'Alle KIs arbeiten zusammen...' : 'Denkt nach...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  collabMode
                    ? 'Nachricht an alle KIs... (Enter = Senden)'
                    : 'Nachricht eingeben... (Enter = Senden, Shift+Enter = Neue Zeile)'
                }
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
              />
              <Button onClick={sendMessage} disabled={!input.trim() || loading} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

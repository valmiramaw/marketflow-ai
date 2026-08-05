'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  provider?: string
  model?: string
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Fehler: ${error.error || 'Unbekannter Fehler'}` },
        ])
        return
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          provider: data.provider,
          model: data.model,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Verbindungsfehler. Bitte versuche es erneut.' },
      ])
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">KI-Assistent</h1>
        <p className="text-muted-foreground mt-1">
          Übergreifender Marketing- & Sales-Assistent (Multi-KI)
        </p>
      </div>

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
            <div
              key={i}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
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
                {msg.provider && (
                  <div className="mt-2 flex gap-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {msg.provider}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {msg.model}
                    </Badge>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Denkt nach...</span>
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
              placeholder="Nachricht eingeben... (Enter = Senden, Shift+Enter = Neue Zeile)"
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
  )
}

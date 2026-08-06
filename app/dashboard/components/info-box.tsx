'use client'

import { useState } from 'react'
import { Info, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoBoxProps {
  title: string
  children: React.ReactNode
  variant?: 'info' | 'ai'
  storageKey?: string
}

export function InfoBox({ title, children, variant = 'info', storageKey }: InfoBoxProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (!storageKey) return false
    if (typeof window === 'undefined') return false
    return localStorage.getItem(`info-${storageKey}`) === '1'
  })

  if (dismissed) return null

  function dismiss() {
    setDismissed(true)
    if (storageKey) localStorage.setItem(`info-${storageKey}`, '1')
  }

  return (
    <div className={cn(
      'rounded-lg border p-4 text-sm relative',
      variant === 'ai'
        ? 'bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-orange-500/5 border-cyan-500/20'
        : 'bg-blue-500/5 border-blue-500/20'
    )}>
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
          variant === 'ai'
            ? 'bg-gradient-to-br from-cyan-500 to-purple-600'
            : 'bg-blue-500/10'
        )}>
          {variant === 'ai' ? (
            <Sparkles className="w-4 h-4 text-white" />
          ) : (
            <Info className="w-4 h-4 text-blue-500" />
          )}
        </div>
        <div>
          <p className="font-medium mb-1">{title}</p>
          <div className="text-muted-foreground space-y-1 [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-0.5 [&_strong]:text-foreground [&_strong]:font-medium">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />,
  error: <XCircle className="w-4 h-4 shrink-0 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500" />,
  info: <Info className="w-4 h-4 shrink-0 text-blue-500" />,
}

const borderColors: Record<ToastVariant, string> = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  warning: 'border-yellow-500/30',
  info: 'border-blue-500/30',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 px-4 py-3 rounded-lg border bg-card shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200 ${borderColors[t.variant]}`}
          >
            {icons[t.variant]}
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-6">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Etwas ist schiefgelaufen</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Ein unerwarteter Fehler ist aufgetreten. Versuche die Seite neu zu laden.
      </p>
      <Button onClick={reset} size="lg">
        <RefreshCw className="w-4 h-4 mr-2" />
        Neu laden
      </Button>
    </div>
  )
}

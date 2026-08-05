'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function AbTestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">A/B Tests</h1>
          <p className="text-muted-foreground mt-1">KI-gesteuerte Anzeigen-Tests</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />Neuer Test</Button>
      </div>

      <Card>
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">
            Keine laufenden A/B Tests. Erstelle einen neuen Test um Anzeigenvarianten zu vergleichen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

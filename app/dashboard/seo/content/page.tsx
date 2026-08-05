'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content-Strategie</h1>
          <p className="text-muted-foreground mt-1">KI-generierte Content-Pläne</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />Neuer Content-Plan</Button>
      </div>
      <Card>
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">
            Noch keine Content-Pläne. Erstelle einen neuen Plan mit KI-Unterstützung.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

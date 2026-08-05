'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export default function CreativesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Werbemittel</h1>
          <p className="text-muted-foreground mt-1">KI-Analyse von Creatives (Gemini Vision)</p>
        </div>
        <Button><Upload className="w-4 h-4 mr-2" />Creative hochladen</Button>
      </div>

      <Card>
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">
            Lade Werbemittel hoch für eine KI-gestützte Analyse durch Gemini Vision.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

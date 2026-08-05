'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function KeywordsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Keywords</h1>
          <p className="text-muted-foreground mt-1">Keyword-Rankings tracken</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />Keyword hinzufügen</Button>
      </div>
      <Card>
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">
            Noch keine Keywords getrackt. Füge Keywords hinzu oder verbinde die Search Console.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO-Audit</h1>
          <p className="text-muted-foreground mt-1">Technisches SEO analysieren</p>
        </div>
        <Button><Search className="w-4 h-4 mr-2" />Audit starten</Button>
      </div>
      <Card>
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">
            Starte ein SEO-Audit um technische Issues, Core Web Vitals und On-Page-Faktoren zu prüfen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

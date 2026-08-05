'use client'

import { KpiCard } from '../components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, TrendingUp, FileText, AlertCircle } from 'lucide-react'

export default function SeoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Search Console, GA4 & Keyword-Tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Organischer Traffic" value="18.320" change={8.1} icon={<Globe className="w-5 h-5" />} />
        <KpiCard title="Keywords Top 10" value="34" change={5.0} icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard title="SEO-Score" value="82/100" change={3.0} icon={<FileText className="w-5 h-5" />} />
        <KpiCard title="Kritische Issues" value="5" change={-2} icon={<AlertCircle className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Keyword-Bewegungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Verbinde Google Search Console in den Einstellungen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content-Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Noch keine Content-Pläne erstellt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

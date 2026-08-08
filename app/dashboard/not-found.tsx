import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-muted p-4 mb-6">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Seite nicht gefunden</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Die gesuchte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
      >
        Zurück zum Dashboard
      </Link>
    </div>
  )
}

import { getGoogleAccessToken } from './oauth'

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta'
const GA_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta'

export interface GA4Property {
  name: string
  displayName: string
  propertyType: string
}

// GA4 Properties auflisten
export async function listProperties(): Promise<GA4Property[]> {
  const token = await getGoogleAccessToken()
  if (!token) throw new Error('Google nicht verbunden')

  const res = await fetch(`${GA_ADMIN_API}/accountSummaries`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('GA4 Admin API Fehler')
  const data = await res.json()

  const properties: GA4Property[] = []
  for (const account of data.accountSummaries || []) {
    for (const prop of account.propertySummaries || []) {
      properties.push({
        name: prop.property,
        displayName: prop.displayName,
        propertyType: prop.propertyType || 'PROPERTY_TYPE_ORDINARY',
      })
    }
  }
  return properties
}

// GA4 Report ausführen
export async function runReport(
  propertyId: string,
  options: {
    startDate: string
    endDate: string
    metrics: string[]
    dimensions?: string[]
    limit?: number
  }
) {
  const token = await getGoogleAccessToken()
  if (!token) throw new Error('Google nicht verbunden')

  const res = await fetch(`${GA4_API}/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: options.startDate, endDate: options.endDate }],
      metrics: options.metrics.map((m) => ({ name: m })),
      dimensions: (options.dimensions || []).map((d) => ({ name: d })),
      limit: options.limit || 100,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`GA4 Report Fehler: ${error}`)
  }

  return res.json()
}

// Traffic-Übersicht der letzten 30 Tage
export async function getTrafficOverview(propertyId: string) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return runReport(propertyId, {
    startDate,
    endDate,
    metrics: ['sessions', 'totalUsers', 'screenPageViews', 'bounceRate', 'averageSessionDuration'],
  })
}

// Traffic nach Quelle
export async function getTrafficBySources(propertyId: string) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return runReport(propertyId, {
    startDate,
    endDate,
    metrics: ['sessions', 'totalUsers'],
    dimensions: ['sessionSource'],
    limit: 20,
  })
}

// Traffic nach Seiten
export async function getTopPages(propertyId: string) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return runReport(propertyId, {
    startDate,
    endDate,
    metrics: ['screenPageViews', 'totalUsers', 'averageSessionDuration'],
    dimensions: ['pagePath'],
    limit: 20,
  })
}

// Tägliche Sessions (für Chart)
export async function getDailySessions(propertyId: string, days = 30) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return runReport(propertyId, {
    startDate,
    endDate,
    metrics: ['sessions', 'totalUsers', 'screenPageViews'],
    dimensions: ['date'],
    limit: days,
  })
}

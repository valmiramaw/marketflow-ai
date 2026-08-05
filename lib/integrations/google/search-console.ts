import { getGoogleAccessToken } from './oauth'

const SC_API = 'https://www.googleapis.com/webmasters/v3'
const SC_API_V2 = 'https://searchconsole.googleapis.com/v1'

export interface SearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[]
  responseAggregationType: string
}

// Alle verifizierten Sites auflisten
export async function listSites(): Promise<{ siteUrl: string; permissionLevel: string }[]> {
  const token = await getGoogleAccessToken()
  if (!token) throw new Error('Google nicht verbunden')

  const res = await fetch(`${SC_API}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('Search Console API Fehler')
  const data = await res.json()
  return data.siteEntry || []
}

// Keyword-Daten aus Search Console holen
export async function getSearchAnalytics(
  siteUrl: string,
  options: {
    startDate: string // YYYY-MM-DD
    endDate: string
    dimensions?: ('query' | 'page' | 'country' | 'device' | 'date')[]
    rowLimit?: number
    startRow?: number
    dimensionFilterGroups?: Array<{
      filters: Array<{
        dimension: string
        operator: string
        expression: string
      }>
    }>
  }
): Promise<SearchAnalyticsResponse> {
  const token = await getGoogleAccessToken()
  if (!token) throw new Error('Google nicht verbunden')

  const res = await fetch(
    `${SC_API_V2}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: options.startDate,
        endDate: options.endDate,
        dimensions: options.dimensions || ['query'],
        rowLimit: options.rowLimit || 100,
        startRow: options.startRow || 0,
        dimensionFilterGroups: options.dimensionFilterGroups,
      }),
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Search Analytics Fehler: ${error}`)
  }

  return res.json()
}

// Top-Keywords der letzten 28 Tage
export async function getTopKeywords(siteUrl: string, limit = 50) {
  const endDate = new Date()
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)

  return getSearchAnalytics(siteUrl, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['query'],
    rowLimit: limit,
  })
}

// Ranking-Verlauf für ein spezifisches Keyword
export async function getKeywordHistory(siteUrl: string, keyword: string, days = 90) {
  const endDate = new Date()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return getSearchAnalytics(siteUrl, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['query', 'date'],
    dimensionFilterGroups: [
      {
        filters: [
          { dimension: 'query', operator: 'equals', expression: keyword },
        ],
      },
    ],
  })
}

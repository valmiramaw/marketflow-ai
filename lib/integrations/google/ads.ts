// Google Ads API Integration
// Nutzt die Google Ads REST API (v17)

import { getGoogleAccessToken } from './oauth'

const ADS_API_BASE = 'https://googleads.googleapis.com/v17'

interface GoogleAdsCustomer {
  customerId: string
  descriptiveName: string
  currencyCode: string
}

interface GoogleAdsCampaign {
  id: string
  name: string
  status: string
  advertisingChannelType: string
  budgetAmountMicros: string
  startDate: string
  endDate?: string
}

interface GoogleAdsMetrics {
  impressions: number
  clicks: number
  conversions: number
  costMicros: number
  ctr: number
  averageCpc: number
}

// Alle zugänglichen Kunden-Accounts abrufen
export async function listAccessibleCustomers(): Promise<string[]> {
  const token = await getGoogleAccessToken()
  if (!token) return []

  const res = await fetch(`${ADS_API_BASE}/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    },
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.resourceNames?.map((r: string) => r.replace('customers/', '')) || []
}

// Kampagnen eines Kunden abrufen
export async function getCampaigns(customerId: string): Promise<GoogleAdsCampaign[]> {
  const token = await getGoogleAccessToken()
  if (!token) return []

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      campaign.start_date,
      campaign.end_date
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name
  `

  const res = await fetch(
    `${ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        'login-customer-id': customerId,
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!res.ok) return []
  const data = await res.json()

  return (data[0]?.results || []).map((r: Record<string, Record<string, string>>) => ({
    id: r.campaign.id,
    name: r.campaign.name,
    status: r.campaign.status?.toLowerCase(),
    advertisingChannelType: r.campaign.advertisingChannelType,
    budgetAmountMicros: r.campaignBudget?.amountMicros || '0',
    startDate: r.campaign.startDate,
    endDate: r.campaign.endDate,
  }))
}

// Kampagnen-Metriken abrufen
export async function getCampaignMetrics(
  customerId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ campaignId: string; campaignName: string; metrics: GoogleAdsMetrics }>> {
  const token = await getGoogleAccessToken()
  if (!token) return []

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `

  const res = await fetch(
    `${ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        'login-customer-id': customerId,
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!res.ok) return []
  const data = await res.json()

  return (data[0]?.results || []).map((r: Record<string, Record<string, string | number>>) => ({
    campaignId: String(r.campaign.id),
    campaignName: String(r.campaign.name),
    metrics: {
      impressions: Number(r.metrics.impressions) || 0,
      clicks: Number(r.metrics.clicks) || 0,
      conversions: Number(r.metrics.conversions) || 0,
      costMicros: Number(r.metrics.costMicros) || 0,
      ctr: Number(r.metrics.ctr) || 0,
      averageCpc: Number(r.metrics.averageCpc) || 0,
    },
  }))
}

// Tägliche Metriken für eine Kampagne
export async function getDailyMetrics(
  customerId: string,
  campaignId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; metrics: GoogleAdsMetrics }>> {
  const token = await getGoogleAccessToken()
  if (!token) return []

  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE campaign.id = ${campaignId}
      AND segments.date BETWEEN '${startDate}' AND '${endDate}'
    ORDER BY segments.date DESC
  `

  const res = await fetch(
    `${ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        'login-customer-id': customerId,
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!res.ok) return []
  const data = await res.json()

  return (data[0]?.results || []).map((r: Record<string, Record<string, string | number>>) => ({
    date: String(r.segments.date),
    metrics: {
      impressions: Number(r.metrics.impressions) || 0,
      clicks: Number(r.metrics.clicks) || 0,
      conversions: Number(r.metrics.conversions) || 0,
      costMicros: Number(r.metrics.costMicros) || 0,
      ctr: Number(r.metrics.ctr) || 0,
      averageCpc: Number(r.metrics.averageCpc) || 0,
    },
  }))
}

// Micros in Euro umrechnen
export function microsToEuros(micros: number): number {
  return micros / 1_000_000
}

// Meta (Facebook & Instagram) Ads API Integration
// Phase 4 Placeholder - wird aktiviert wenn Meta OAuth implementiert ist

const META_API_BASE = 'https://graph.facebook.com/v19.0'

interface MetaCampaign {
  id: string
  name: string
  status: string
  objective: string
  dailyBudget: string
  lifetimeBudget: string
}

interface MetaInsights {
  impressions: number
  clicks: number
  conversions: number
  spend: string
  ctr: string
  cpc: string
}

// Meta-Kampagnen abrufen
export async function getMetaCampaigns(
  accessToken: string,
  adAccountId: string
): Promise<MetaCampaign[]> {
  const res = await fetch(
    `${META_API_BASE}/act_${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${accessToken}`
  )

  if (!res.ok) return []
  const data = await res.json()

  return (data.data || []).map((c: Record<string, string>) => ({
    id: c.id,
    name: c.name,
    status: c.status?.toLowerCase(),
    objective: c.objective,
    dailyBudget: c.daily_budget || '0',
    lifetimeBudget: c.lifetime_budget || '0',
  }))
}

// Meta-Kampagnen-Insights abrufen
export async function getMetaCampaignInsights(
  accessToken: string,
  campaignId: string,
  dateRange: { since: string; until: string }
): Promise<MetaInsights | null> {
  const res = await fetch(
    `${META_API_BASE}/${campaignId}/insights?fields=impressions,clicks,conversions,spend,ctr,cpc&time_range={"since":"${dateRange.since}","until":"${dateRange.until}"}&access_token=${accessToken}`
  )

  if (!res.ok) return null
  const data = await res.json()
  const row = data.data?.[0]

  if (!row) return null

  return {
    impressions: parseInt(row.impressions) || 0,
    clicks: parseInt(row.clicks) || 0,
    conversions: parseInt(row.conversions) || 0,
    spend: row.spend || '0',
    ctr: row.ctr || '0',
    cpc: row.cpc || '0',
  }
}

// Meta Ad-Accounts auflisten
export async function getMetaAdAccounts(accessToken: string): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(
    `${META_API_BASE}/me/adaccounts?fields=id,name&access_token=${accessToken}`
  )

  if (!res.ok) return []
  const data = await res.json()

  return (data.data || []).map((a: { id: string; name: string }) => ({
    id: a.id.replace('act_', ''),
    name: a.name,
  }))
}

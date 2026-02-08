/**
 * ★★★ META ADS CLIENT ★★★
 * Client pour interagir avec l'API Meta Ads (Facebook/Instagram)
 */

/**
 * Returns true if Meta Ads OAuth is configured (env vars set).
 * Use this before initiating connect flow; the client itself uses tokens from DB.
 */
export function isMetaAdsConfigured(): boolean {
  return !!(
    typeof process !== 'undefined' &&
    process.env.META_APP_ID &&
    process.env.META_APP_SECRET
  );
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MetaInsights {
  impressions: number;
  clicks: number;
  spend: number;
  cpc: number;
  cpm: number;
  ctr: number;
  reach: number;
  frequency: number;
  conversions: number;
  costPerConversion: number;
  conversionRate: number;
  roas?: number;
}

export class MetaAdsClient {
  private accessToken: string;
  private adAccountId: string;
  private apiVersion = 'v18.0';

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
  }

  /**
   * Récupère les campagnes Meta
   */
  async getCampaigns(params?: {
    status?: string;
    limit?: number;
  }): Promise<MetaCampaign[]> {
    const url = `https://graph.facebook.com/${this.apiVersion}/act_${this.adAccountId}/campaigns`;
    const queryParams = new URLSearchParams({
      access_token: this.accessToken,
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time',
      limit: String(params?.limit || 100),
    });

    if (params?.status) {
      queryParams.set('filtering', JSON.stringify([{ field: 'status', operator: 'EQUAL', value: params.status }]));
    }

    const response = await fetch(`${url}?${queryParams.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return (data.data || []).map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      budget: campaign.daily_budget || campaign.lifetime_budget,
      createdAt: campaign.created_time,
      updatedAt: campaign.updated_time,
    }));
  }

  /**
   * Récupère les insights (métriques) pour une période
   */
  async getInsights(params: {
    dateFrom: string;
    dateTo: string;
    level?: 'account' | 'campaign' | 'adset' | 'ad';
    breakdowns?: string[];
  }): Promise<MetaInsights> {
    const url = `https://graph.facebook.com/${this.apiVersion}/act_${this.adAccountId}/insights`;
    const queryParams = new URLSearchParams({
      access_token: this.accessToken,
      time_range: JSON.stringify({
        since: params.dateFrom,
        until: params.dateTo,
      }),
      level: params.level || 'account',
      fields: 'impressions,clicks,spend,cpc,cpm,ctr,reach,frequency,actions,action_values',
    });

    if (params.breakdowns && params.breakdowns.length > 0) {
      queryParams.set('breakdowns', params.breakdowns.join(','));
    }

    const response = await fetch(`${url}?${queryParams.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    const insights = data.data?.[0] || {};
    const actions = insights.actions || [];
    const actionValues = insights.action_values || [];

    // Extraire les conversions
    const purchaseAction = actions.find((a: any) => a.action_type === 'purchase') || {};
    const purchaseValue = actionValues.find((a: any) => a.action_type === 'purchase') || {};

    return {
      impressions: parseInt(insights.impressions || 0),
      clicks: parseInt(insights.clicks || 0),
      spend: parseFloat(insights.spend || 0),
      cpc: parseFloat(insights.cpc || 0),
      cpm: parseFloat(insights.cpm || 0),
      ctr: parseFloat(insights.ctr || 0),
      reach: parseInt(insights.reach || 0),
      frequency: parseFloat(insights.frequency || 0),
      conversions: parseInt(purchaseAction.value || 0),
      costPerConversion: purchaseAction.value > 0 ? parseFloat(insights.spend || 0) / parseInt(purchaseAction.value) : 0,
      conversionRate: insights.clicks > 0 ? (parseInt(purchaseAction.value || 0) / parseInt(insights.clicks || 1)) * 100 : 0,
      roas: purchaseValue.value > 0 ? parseFloat(purchaseValue.value) / parseFloat(insights.spend || 1) : 0,
    };
  }

  /**
   * Récupère les conversions
   */
  async getConversions(params: {
    dateFrom: string;
    dateTo: string;
  }): Promise<{
    total: number;
    byType: Record<string, number>;
    cost: number;
    value: number;
    roas: number;
  }> {
    const insights = await this.getInsights({
      ...params,
      level: 'account',
    });

    return {
      total: insights.conversions,
      byType: {
        purchase: insights.conversions,
      },
      cost: insights.costPerConversion,
      value: insights.roas ? insights.spend * insights.roas : 0,
      roas: insights.roas || 0,
    };
  }
}

/**
 * ★★★ TIKTOK ADS CLIENT ★★★
 * Client pour interagir avec l'API TikTok Ads
 */

export interface TikTokCampaign {
  id: string;
  name: string;
  status: string;
  budget?: number;
  startTime?: string;
  endTime?: string;
}

export interface TikTokInsights {
  impressions: number;
  clicks: number;
  spend: number;
  cpc: number;
  cpm: number;
  ctr: number;
  conversions: number;
  costPerConversion: number;
  conversionRate: number;
  roas?: number;
}

export class TikTokAdsClient {
  private accessToken: string;
  private advertiserId: string;

  constructor(accessToken: string, advertiserId: string) {
    this.accessToken = accessToken;
    this.advertiserId = advertiserId;
  }

  /**
   * Récupère les campagnes TikTok
   */
  async getCampaigns(params?: {
    status?: string;
    limit?: number;
  }): Promise<TikTokCampaign[]> {
    const url = 'https://business-api.tiktok.com/open_api/v1.3/campaign/get/';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        advertiser_id: this.advertiserId,
        fields: ['campaign_id', 'campaign_name', 'operation_status', 'budget', 'create_time', 'modify_time'],
        filtering: params?.status ? { operation_status: params.status } : undefined,
        page_size: params?.limit || 100,
      }),
    });

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`TikTok API Error: ${data.message}`);
    }

    return (data.data?.list || []).map((campaign: any) => ({
      id: campaign.campaign_id,
      name: campaign.campaign_name,
      status: campaign.operation_status,
      budget: campaign.budget,
      startTime: campaign.create_time,
      endTime: campaign.modify_time,
    }));
  }

  /**
   * Récupère les insights
   */
  async getInsights(params: {
    dateFrom: string;
    dateTo: string;
    level?: 'CAMPAIGN' | 'ADGROUP' | 'AD';
  }): Promise<TikTokInsights> {
    const url = 'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        advertiser_id: this.advertiserId,
        service_type: 'AUCTION',
        report_type: 'BASIC',
        data_level: params.level || 'CAMPAIGN',
        dimensions: ['stat_time_day'],
        metrics: [
          'impressions',
          'clicks',
          'spend',
          'ctr',
          'cpc',
          'cpm',
          'conversion',
          'cost_per_conversion',
          'conversion_rate',
        ],
        start_date: params.dateFrom,
        end_date: params.dateTo,
      }),
    });

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`TikTok API Error: ${data.message}`);
    }

    const insights = data.data?.list?.[0] || {};

    return {
      impressions: parseInt(insights.impressions || 0),
      clicks: parseInt(insights.clicks || 0),
      spend: parseFloat(insights.spend || 0),
      cpc: parseFloat(insights.cpc || 0),
      cpm: parseFloat(insights.cpm || 0),
      ctr: parseFloat(insights.ctr || 0),
      conversions: parseInt(insights.conversion || 0),
      costPerConversion: parseFloat(insights.cost_per_conversion || 0),
      conversionRate: parseFloat(insights.conversion_rate || 0),
      roas: 0, // TikTok ne retourne pas directement le ROAS
    };
  }
}

/**
 * ★★★ TIKTOK ADS PAGE ★★★
 * Page pour gérer les campagnes TikTok Ads
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function TikTokAdsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/ads/tiktok/connect');
      const data = await response.json();
      if (data.oauthUrl) {
        window.location.href = data.oauthUrl;
      }
    } catch (error) {
      console.error('Error connecting TikTok Ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">TikTok Ads</h1>
          <p className="text-zinc-400 mt-2">
            Connect your TikTok Ads account to track campaigns and performance
          </p>
        </div>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Connect TikTok Ads</h2>
              <p className="text-zinc-400 mb-6">
                Connect your TikTok Ads account to start tracking your campaigns,
                performance metrics, and ROI.
              </p>
              <Button onClick={handleConnect} disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect TikTok Ads Account
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">TikTok Ads</h1>
        <p className="text-zinc-400 mt-2">Track your TikTok ad campaigns</p>
      </div>
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-12 text-center text-zinc-400">
          TikTok Ads dashboard coming soon...
        </CardContent>
      </Card>
    </div>
  );
}

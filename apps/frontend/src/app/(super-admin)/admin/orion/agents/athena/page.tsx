'use client';

import React, { useState } from 'react';
import { Brain, CheckCircle, Clock, TrendingUp, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function AthenaAgentPage() {
  const [welcomeDelay, setWelcomeDelay] = useState('0');
  const [day3FollowUp, setDay3FollowUp] = useState(true);
  const [featureDiscovery, setFeatureDiscovery] = useState(true);
  const [healthThreshold, setHealthThreshold] = useState('40');

  const recentActivity = [
    { id: '1', event: 'Welcome email sent', user: 'user@example.com', time: '2 min ago' },
    { id: '2', event: 'Day 3 check-in triggered', user: 'another@example.com', time: '15 min ago' },
    { id: '3', event: 'Feature discovery completed', user: 'new@example.com', time: '1 hour ago' },
    { id: '4', event: 'Health score alert', user: 'atrisk@example.com', time: '2 hours ago' },
  ];

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <Brain className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">ATHENA - Onboarding Orchestrator</h1>
          <p className="text-zinc-400 text-sm">
            Adaptive onboarding flows, email sequences, and health-based interventions
          </p>
        </div>
      </div>

      {/* Status card */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg">Agent status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600/80 text-white border-0">Active</Badge>
            <span className="text-zinc-400 text-sm">Agent is running</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Last run: 5 min ago</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-sm">Success rate: 98%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-100">Configuration</CardTitle>
            <CardDescription className="text-zinc-400">
              Onboarding sequence and intervention thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-zinc-400">Welcome email delay (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={welcomeDelay}
                onChange={(e) => setWelcomeDelay(e.target.value)}
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-100">Day 3 follow-up</Label>
                <p className="text-zinc-400 text-sm">Send check-in email on day 3</p>
              </div>
              <Switch checked={day3FollowUp} onCheckedChange={setDay3FollowUp} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-zinc-100">Feature discovery sequence</Label>
                <p className="text-zinc-400 text-sm">Guided tour of key features</p>
              </div>
              <Switch checked={featureDiscovery} onCheckedChange={setFeatureDiscovery} />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Health score threshold for intervention</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={healthThreshold}
                onChange={(e) => setHealthThreshold(e.target.value)}
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100"
              />
              <p className="text-zinc-500 text-xs">Trigger outreach when score drops below this</p>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              Save configuration
            </Button>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-100">Metrics</CardTitle>
            <CardDescription className="text-zinc-400">This month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-700/50">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                <span className="text-zinc-300">Users onboarded</span>
              </div>
              <span className="text-xl font-semibold text-zinc-100">1,247</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-700/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <span className="text-zinc-300">Completion rate</span>
              </div>
              <span className="text-xl font-semibold text-zinc-100">87%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-700/50">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                <span className="text-zinc-300">Avg. time to activation</span>
              </div>
              <span className="text-xl font-semibold text-zinc-100">2.3 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">Recent activity</CardTitle>
          <CardDescription className="text-zinc-400">Latest onboarding events</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-zinc-700/50 last:border-0"
              >
                <div>
                  <span className="text-zinc-200">{item.event}</span>
                  <span className="text-zinc-500 text-sm ml-2">— {item.user}</span>
                </div>
                <span className="text-zinc-500 text-sm">{item.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

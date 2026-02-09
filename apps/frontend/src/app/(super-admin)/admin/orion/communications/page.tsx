'use client';

/**
 * HERMES - Communication Hub (ORION Phase 2)
 * Templates, Campaigns, Logs with mock data
 */
import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MessageSquare,
  FileText,
  Send,
  BarChart3,
  Megaphone,
  Eye,
  Pencil,
  ArrowLeft,
} from 'lucide-react';

// Mock stats
const MOCK_STATS = {
  templates: 24,
  campaigns: 12,
  emailsSent: 48200,
  openRate: '34%',
};

// Mock templates
const MOCK_TEMPLATES = [
  { id: '1', name: 'Welcome Email', subject: 'Welcome to Luneo!', category: 'Onboarding', updatedAt: '2025-02-08' },
  { id: '2', name: 'Day 3 Follow-up', subject: 'How are you getting started?', category: 'Onboarding', updatedAt: '2025-02-07' },
  { id: '3', name: 'Churn Prevention', subject: 'We miss you', category: 'Retention', updatedAt: '2025-02-06' },
  { id: '4', name: 'Upsell Pro', subject: 'Unlock more with Pro', category: 'Revenue', updatedAt: '2025-02-05' },
  { id: '5', name: 'Password Reset', subject: 'Reset your password', category: 'Transactional', updatedAt: '2025-02-04' },
];

// Mock campaigns
const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Q1 Welcome Series', status: 'SENT', sent: 12500, opened: 4250, clicked: 890 },
  { id: '2', name: 'Trial Ending Reminder', status: 'SENDING', sent: 3200, opened: 0, clicked: 0 },
  { id: '3', name: 'Feature Discovery', status: 'DRAFT', sent: 0, opened: 0, clicked: 0 },
  { id: '4', name: 'Win-back Campaign', status: 'SENT', sent: 8400, opened: 2100, clicked: 420 },
];

// Mock logs
const MOCK_LOGS = [
  { id: '1', recipient: 'user@example.com', subject: 'Welcome to Luneo!', status: 'sent', timestamp: '2025-02-09 10:32' },
  { id: '2', recipient: 'client@acme.com', subject: 'Your trial ends in 3 days', status: 'delivered', timestamp: '2025-02-09 09:15' },
  { id: '3', recipient: 'hello@startup.io', subject: 'We miss you', status: 'opened', timestamp: '2025-02-09 08:44' },
  { id: '4', recipient: 'admin@brand.com', subject: 'Invoice #1234', status: 'clicked', timestamp: '2025-02-08 18:22' },
  { id: '5', recipient: 'support@co.com', subject: 'Password reset', status: 'sent', timestamp: '2025-02-08 16:00' },
];

export default function OrionCommunicationsPage() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orion">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-amber-400" />
            HERMES - Communication Hub
          </h1>
          <p className="mt-1 text-zinc-400">
            Email templates, campaigns, and delivery logs
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-700 bg-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Templates</p>
                <p className="text-2xl font-bold text-amber-400">{MOCK_STATS.templates}</p>
              </div>
              <div className="rounded-lg bg-zinc-700/50 p-3">
                <FileText className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-700 bg-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Campaigns</p>
                <p className="text-2xl font-bold text-cyan-400">{MOCK_STATS.campaigns}</p>
              </div>
              <div className="rounded-lg bg-zinc-700/50 p-3">
                <Megaphone className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-700 bg-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Emails sent</p>
                <p className="text-2xl font-bold text-green-400">{MOCK_STATS.emailsSent.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-zinc-700/50 p-3">
                <Send className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-700 bg-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Open rate</p>
                <p className="text-2xl font-bold text-purple-400">{MOCK_STATS.openRate}</p>
              </div>
              <div className="rounded-lg bg-zinc-700/50 p-3">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-zinc-800 border border-zinc-700">
          <TabsTrigger value="templates" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">
            Templates
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_TEMPLATES.map((t) => (
              <Card key={t.id} className="border-zinc-700 bg-zinc-800">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base text-white">{t.name}</CardTitle>
                    <Badge variant="secondary" className="bg-zinc-700 text-zinc-300 text-xs">
                      {t.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{t.subject}</p>
                  <p className="text-xs text-zinc-500">Updated {t.updatedAt}</p>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card className="border-zinc-700 bg-zinc-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Sent</TableHead>
                    <TableHead className="text-zinc-400">Opened</TableHead>
                    <TableHead className="text-zinc-400">Clicked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_CAMPAIGNS.map((c) => (
                    <TableRow key={c.id} className="border-zinc-700 hover:bg-zinc-700/50">
                      <TableCell className="text-white font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            c.status === 'SENT'
                              ? 'bg-green-500/20 text-green-400'
                              : c.status === 'SENDING'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-zinc-600 text-zinc-300'
                          }
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300">{c.sent.toLocaleString()}</TableCell>
                      <TableCell className="text-zinc-300">{c.opened.toLocaleString()}</TableCell>
                      <TableCell className="text-zinc-300">{c.clicked.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="border-zinc-700 bg-zinc-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Recipient</TableHead>
                    <TableHead className="text-zinc-400">Subject</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_LOGS.map((log) => (
                    <TableRow key={log.id} className="border-zinc-700 hover:bg-zinc-700/50">
                      <TableCell className="text-zinc-300 font-mono text-sm">{log.recipient}</TableCell>
                      <TableCell className="text-white">{log.subject}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            log.status === 'opened' || log.status === 'clicked'
                              ? 'bg-green-500/20 text-green-400'
                              : log.status === 'delivered'
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'bg-zinc-600 text-zinc-300'
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">{log.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

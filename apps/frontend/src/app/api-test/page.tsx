'use client';

import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, Loader2, Code, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ApiTestPageContent() {
  const [endpoint, setEndpoint] = useState('/api/health');
  const [method, setMethod] = useState('GET');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${apiUrl}${endpoint}`;

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const res = await fetch(url, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, method]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">API Test</h1>

        <Card className="bg-gray-800 border-gray-700 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-4 py-2"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Endpoint</label>
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="/api/health"
              />
            </div>

            <Button onClick={handleTest} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test API
                </>
              )}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="bg-red-900/20 border-red-500 p-6 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Error</span>
            </div>
            <p className="text-red-300 mt-2">{error}</p>
          </Card>
        )}

        {response && (
          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {response.status >= 200 && response.status < 300 ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white font-semibold">
                  {response.status} {response.statusText}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-gray-300 mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Response Data
                </h3>
                <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm text-gray-300">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-gray-300 mb-2">Headers</h3>
                <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm text-gray-300">
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

const ApiTestPageMemo = memo(ApiTestPageContent);

export default function ApiTestPage() {
  return (
    <ErrorBoundary componentName="ApiTestPage">
      <ApiTestPageMemo />
    </ErrorBoundary>
  );
}


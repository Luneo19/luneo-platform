'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Support</h1>
          <p className="text-xl text-gray-400">Obtenez de l'aide</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700 text-center">
            <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Email</h3>
            <p className="text-sm text-gray-400 mb-4">support@luneo.app</p>
            <p className="text-xs text-gray-500">Réponse sous 24h</p>
          </Card>

          <Card className="p-6 bg-gray-800/50 border-gray-700 text-center">
            <MessageCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Chat</h3>
            <p className="text-sm text-gray-400 mb-4">Live chat</p>
            <p className="text-xs text-gray-500">9h-18h CET</p>
          </Card>

          <Card className="p-6 bg-gray-800/50 border-gray-700 text-center">
            <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Community</h3>
            <p className="text-sm text-gray-400 mb-4">Discord</p>
            <Link href="https://discord.gg/luneo">
              <Button size="sm" variant="outline" className="border-gray-600 text-white">
                Rejoindre
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}


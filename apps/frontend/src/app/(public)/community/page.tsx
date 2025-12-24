'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { MessageCircle, Users, Github, Twitter } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CommunityPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Rejoignez la Communauté
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            +10 000 créateurs, développeurs et entrepreneurs utilisent Luneo
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link href="https://discord.gg/luneo" target="_blank" className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 hover:bg-white/15 transition-all">
            <MessageCircle className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Discord</h3>
            <p className="text-gray-300 mb-4">
              Échangez avec la communauté, posez vos questions, partagez vos créations
            </p>
            <div className="text-purple-400">5 000+ membres</div>
          </Link>

          <Link href="https://github.com/luneo" target="_blank" className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 hover:bg-white/15 transition-all">
            <Github className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">GitHub</h3>
            <p className="text-gray-300 mb-4">
              SDKs open-source, examples, templates
            </p>
            <div className="text-gray-400">2 000+ stars</div>
          </Link>

          <Link href="https://twitter.com/luneo" target="_blank" className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 hover:bg-white/15 transition-all">
            <Twitter className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Twitter</h3>
            <p className="text-gray-300 mb-4">
              Actualités, tips, nouveautés
            </p>
            <div className="text-blue-400">15k followers</div>
          </Link>

          <Link href="/help/documentation" className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 hover:bg-white/15 transition-all">
            <Users className="w-12 h-12 text-pink-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Forum</h3>
            <p className="text-gray-300 mb-4">
              Questions, tutoriels, best practices
            </p>
            <div className="text-pink-400">1 000+ discussions</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

const CommunityPageMemo = memo(CommunityPageContent);

export default function CommunityPage() {
  return (
    <ErrorBoundary componentName="CommunityPage">
      <CommunityPageMemo />
    </ErrorBoundary>
  );
}


'use client';

import React, { memo, useMemo } from 'react';
import { Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function VideoCoursePageContent() {
  const videos = useMemo(() => [
    { title: 'Introduction à Luneo', duration: '5:30', emoji: '🎬' },
    { title: 'Créer son premier customizer', duration: '8:45', emoji: '🎨' },
    { title: 'Configurateur 3D avancé', duration: '12:20', emoji: '🎮' },
    { title: 'Virtual Try-On setup', duration: '10:15', emoji: '👓' },
    { title: 'Génération IA en masse', duration: '15:00', emoji: '🤖' }
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Cours Vidéo</h1>
          <p className="text-xl text-gray-400">Apprenez Luneo en vidéo</p>
        </div>

        <div className="space-y-4">
          {videos.map((v, i) => (
            <Card key={i} className="p-6 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{v.emoji}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{v.title}</h3>
                    <p className="text-sm text-gray-400">{v.duration}</p>
                  </div>
                </div>
                <Play className="w-8 h-8 text-blue-400" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

const VideoCoursePageMemo = memo(VideoCoursePageContent);

export default function VideoCoursePage() {
  return (
    <ErrorBoundary componentName="VideoCoursePage">
      <VideoCoursePageMemo />
    </ErrorBoundary>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Upload, Video, Play } from 'lucide-react';

const MOTION_PRESETS = [
  { id: '360-rotation', label: '360° Rotation', description: 'Rotation complète du sujet' },
  { id: 'zoom-in', label: 'Zoom in', description: 'Zoom progressif sur l\'image' },
  { id: 'parallax', label: 'Parallax', description: 'Effet de profondeur parallax' },
  { id: 'turntable', label: 'Turntable', description: 'Plateau tournant produit' },
] as const;

const DURATIONS = [5, 10] as const;
const RESOLUTIONS = [
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: '4k', label: '4K' },
] as const;
const PROVIDERS = [
  { id: 'runway', label: 'Runway' },
  { id: 'pika', label: 'Pika Labs' },
] as const;

interface VideoGeneration {
  id: string;
  sourceImageUrl: string | null;
  preset: string;
  duration: number;
  resolution: string;
  provider: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultUrl: string | null;
  createdAt: string;
}

export function VideoPageClient() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [motionPreset, setMotionPreset] = useState<string>(MOTION_PRESETS[0].id);
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState<string>('1080p');
  const [provider, setProvider] = useState<string>('runway');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceFile(file);
    const url = URL.createObjectURL(file);
    setSourcePreview(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  const handleGenerate = async () => {
    if (!sourceFile) return;
    setIsGenerating(true);
    try {
      // TODO: Call API to create video generation
      // const formData = new FormData(); formData.append('image', sourceFile); ...
      setIsGenerating(false);
    } catch {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: VideoGeneration['status']) => {
    const styles = {
      PENDING: 'bg-white/10 text-white/50',
      PROCESSING: 'bg-blue-500/20 text-blue-400',
      COMPLETED: 'bg-green-500/20 text-green-400',
      FAILED: 'bg-red-500/20 text-red-400',
    };
    return styles[status] ?? styles.PENDING;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Génération vidéo</h1>
          <p className="text-white/60 mt-1">Créez des vidéos à partir d&apos;images avec des presets de mouvement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source image */}
        <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-white mb-4">Image source</h2>
          <label className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-white/[0.1] rounded-xl cursor-pointer hover:border-indigo-500/30 transition-colors overflow-hidden">
            {sourcePreview ? (
              <img src={sourcePreview} alt="Preview" className="w-full h-full object-cover max-h-64" />
            ) : (
              <>
                <Upload className="w-10 h-10 text-white/30 mb-2" />
                <span className="text-white/50 text-sm">Cliquez pour uploader une image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Settings */}
        <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03] space-y-5">
          <h2 className="text-lg font-semibold text-white mb-4">Paramètres</h2>

          <div>
            <p className="text-sm text-white/60 mb-2">Preset de mouvement</p>
            <div className="grid grid-cols-2 gap-2">
              {MOTION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setMotionPreset(preset.id)}
                  className={`rounded-xl px-4 py-3 text-left transition-colors border ${
                    motionPreset === preset.id
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                      : 'border-white/[0.1] bg-white/[0.03] text-white/70 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="font-medium block">{preset.label}</span>
                  <span className="text-xs text-white/50">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-white/60 mb-2">Durée</p>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    duration === d ? 'bg-indigo-600 text-white' : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.08]'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-white/60 mb-2">Résolution</p>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 focus:outline-none"
            >
              {RESOLUTIONS.map((r) => (
                <option key={r.id} value={r.id} className="bg-zinc-900">{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm text-white/60 mb-2">Provider</p>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 focus:outline-none"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900">{p.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!sourceFile || isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5" />
            {isGenerating ? 'Génération...' : 'Générer la vidéo'}
          </button>
        </div>
      </div>

      {/* Recent generations */}
      <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-white mb-4">Générations récentes</h2>
        {generations.length === 0 ? (
          <p className="text-white/40 text-center py-8">Aucune génération vidéo pour le moment</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generations.map((gen) => (
              <div key={gen.id} className="bg-white/[0.03] rounded-xl overflow-hidden border border-white/[0.06]">
                <div className="aspect-video bg-white/[0.05] flex items-center justify-center">
                  {gen.resultUrl ? (
                    <a href={gen.resultUrl} target="_blank" rel="noopener noreferrer" className="p-2">
                      <Play className="w-10 h-10 text-indigo-400" />
                    </a>
                  ) : (
                    <Video className="w-10 h-10 text-white/30" />
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs text-white/50">{gen.preset} · {gen.duration}s</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(gen.status)}`}>
                    {gen.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

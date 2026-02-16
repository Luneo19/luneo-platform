'use client';

import { useState, useCallback } from 'react';

interface BulkJob {
  id: string;
  name: string;
  status: string;
  variablesCount: number;
  completedCount: number;
  failedCount: number;
  estimatedCredits: number;
  createdAt: string;
}

export function BulkGenerationPageClient() {
  const [template, setTemplate] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);

  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      // Generate preview of first 3 rows
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const previews = lines.slice(1, 4).map(line => {
        const values = line.split(',');
        let result = template;
        headers.forEach((h, i) => {
          result = result.replace(new RegExp(`\\{\\{${h}\\}\\}`, 'g'), values[i]?.trim() || '');
        });
        return result;
      });
      setPreview(previews);
    };
    reader.readAsText(file);
  }, [template]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // TODO: Call API to create bulk job
      // const response = await fetch('/api/v1/ai-studio/bulk', { ... });
      setIsCreating(false);
    } catch {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk Generation</h1>
          <p className="text-white/60 mt-1">Générez des centaines d&apos;images en une seule opération avec des templates et variables CSV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Configuration */}
        <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-white mb-4">1. Template de prompt</h2>
          <p className="text-sm text-white/50 mb-3">Utilisez des variables entre doubles accolades: {`{{nom_produit}}`}, {`{{couleur}}`}</p>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Photo produit professionnelle de {{nom_produit}} en {{couleur}}, studio lighting, fond blanc, 8k"
            className="w-full h-32 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:outline-none resize-none"
          />
        </div>

        {/* CSV Upload */}
        <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-white mb-4">2. Variables CSV</h2>
          <p className="text-sm text-white/50 mb-3">Importez un fichier CSV avec vos variables</p>
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/[0.1] rounded-xl cursor-pointer hover:border-indigo-500/30 transition-colors">
            <svg className="w-8 h-8 text-white/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <span className="text-white/50 text-sm">{csvContent ? 'CSV chargé' : 'Cliquez pour uploader un CSV'}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-white mb-4">3. Aperçu</h2>
          <div className="space-y-2">
            {preview.map((p, i) => (
              <div key={i} className="bg-white/[0.05] rounded-lg px-4 py-2 text-sm text-white/80">{p}</div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-white/50">Estimation : ~{preview.length * 2} crédits par aperçu</span>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Création...' : 'Lancer la génération'}
            </button>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-white mb-4">Jobs récents</h2>
        {jobs.length === 0 ? (
          <p className="text-white/40 text-center py-8">Aucun job bulk pour le moment</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3">
                <div>
                  <p className="text-white font-medium">{job.name}</p>
                  <p className="text-sm text-white/50">{job.completedCount}/{job.variablesCount} terminés</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  job.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                  job.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400' :
                  job.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                  'bg-white/10 text-white/50'
                }`}>{job.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

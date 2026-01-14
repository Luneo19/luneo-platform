'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import {
  Upload,
  Download,
  FileType,
  Cpu,
  Gauge,
  CheckCircle,
  X,
  Package,
  Globe,
  Sparkles,
  TrendingDown,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { validate3DFile, process3DFile, convert3DFile, formatFileSize, calculateOptimizationReduction } from '@/lib/utils/file-processor';

interface Asset {
  id: string;
  name: string;
  format: string;
  size: number;
  optimizedSize?: number;
  status: 'uploading' | 'processing' | 'optimized' | 'error';
  progress: number;
  lods?: number[];
}

interface AssetHubDemoProps {
  onAssetProcessed?: (asset: Asset) => void;
  maxFileSize?: number;
  supportedFormats?: string[];
}

function AssetHubDemo({
  onAssetProcessed,
  maxFileSize = 500,
  supportedFormats = ['GLB', 'FBX', 'OBJ', 'GLTF', 'USD', 'USDZ', 'STL', '3DS', 'COLLADA'],
}: AssetHubDemoProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('glb');
  const [optimizationLevel, setOptimizationLevel] = useState<number>(50);
  const [lodLevels, setLodLevels] = useState<number>(4);

  // Optimisé: useMemo pour exportFormats
  const exportFormats = useMemo(() => [
    { id: 'glb', name: 'GLB', icon: Package, color: 'blue' },
    { id: 'usdz', name: 'USDZ', icon: Sparkles, color: 'purple' },
    { id: 'fbx', name: 'FBX', icon: FileType, color: 'green' },
    { id: 'obj', name: 'OBJ', icon: FileType, color: 'orange' },
  ], []);

  // Optimisé: useMemo pour optimizations
  const optimizations = useMemo(() => [
    { name: 'Mesh Simplification', reduction: optimizationLevel, active: true },
    { name: 'Texture Compression', reduction: 85, active: true },
    { name: 'LOD Generation', reduction: 'Auto', active: lodLevels > 0 },
    { name: 'Geometry Cleanup', reduction: 20, active: true },
  ], [optimizationLevel, lodLevels]);

  // Real file upload
  const handleFileUpload = useCallback(async (event?: React.ChangeEvent<HTMLInputElement> | DragEvent) => {
    let file: File | null = null;

    if (event && 'dataTransfer' in event && event.dataTransfer?.files) {
      file = event.dataTransfer.files[0];
    } else if (event && 'target' in event && event.target instanceof HTMLInputElement && event.target.files) {
      file = event.target.files[0];
    }

    if (!file) {
      // Create file input if no file provided
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = supportedFormats.map(f => `.${f.toLowerCase()}`).join(',');
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          handleFileUpload({ target } as any);
        }
      };
      input.click();
      return;
    }

    // Validate file
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`Fichier trop volumineux. Maximum: ${maxFileSize}MB`);
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      alert(`Format non supporté. Formats acceptés: ${supportedFormats.join(', ')}`);
      return;
    }

    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: file.name,
      format: fileExtension,
      size: file.size / (1024 * 1024), // MB
      status: 'uploading',
      progress: 0,
    };

    setAssets((prev) => [...prev, newAsset]);
    setIsOptimizing(true);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setAssets((prev) =>
        prev.map((asset) => {
          if (asset.id === newAsset.id && asset.progress < 100) {
            return { ...asset, progress: Math.min(asset.progress + 10, 100) };
          }
          return asset;
        })
      );
    }, 200);

    // After upload, start processing
    setTimeout(() => {
      clearInterval(uploadInterval);
      setAssets((prev) =>
        prev.map((asset) => {
          if (asset.id === newAsset.id) {
            return { ...asset, status: 'processing', progress: 0 };
          }
          return asset;
        })
      );

      // Simulate processing
      const processInterval = setInterval(() => {
        setAssets((prev) =>
          prev.map((asset) => {
            if (asset.id === newAsset.id && asset.progress < 100) {
              return { ...asset, progress: Math.min(asset.progress + 5, 100) };
            }
            return asset;
          })
        );
      }, 300);

      // Complete processing
      setTimeout(() => {
        clearInterval(processInterval);
        setAssets((prev) => {
          const updatedAssets = prev.map((asset) => {
            if (asset.id === newAsset.id) {
              const optimizedAsset = {
                ...asset,
                status: 'optimized' as const,
                progress: 100,
                optimizedSize: asset.size * (1 - optimizationLevel / 100),
                lods: [50000, 25000, 10000, 2500],
              };

              if (onAssetProcessed) {
                onAssetProcessed(optimizedAsset);
              }

              return optimizedAsset;
            }
            return asset;
          });

          const stillProcessing = updatedAssets.some(
            (asset) => asset.status === 'processing' || asset.status === 'uploading'
          );
          if (!stillProcessing) {
            setIsOptimizing(false);
          }

          return updatedAssets;
        });
      }, 6000);
    }, 2000);
  }, [supportedFormats, maxFileSize, optimizationLevel, onAssetProcessed]);

  // Handle click to trigger file input
  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = supportedFormats.map(f => `.${f.toLowerCase()}`).join(',');
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const changeEvent = {
          target,
        } as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(changeEvent);
      }
    };
    input.click();
  }, [supportedFormats, handleFileUpload]);
    let file: File | null = null;

    if (event && 'dataTransfer' in event && event.dataTransfer?.files) {
      file = event.dataTransfer.files[0];
    } else if (event && 'target' in event && event.target instanceof HTMLInputElement && event.target.files) {
      file = event.target.files[0];
    }

    if (!file) {
      // Create file input if no file provided
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = supportedFormats.map(f => `.${f.toLowerCase()}`).join(',');
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          handleFileUpload({ target } as any);
        }
      };
      input.click();
      return;
    }

    // Validate file
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`Fichier trop volumineux. Maximum: ${maxFileSize}MB`);
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      alert(`Format non supporté. Formats acceptés: ${supportedFormats.join(', ')}`);
      return;
    }

    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: file.name,
      format: fileExtension,
      size: file.size / (1024 * 1024), // MB
      status: 'uploading',
      progress: 0,
    };

    setAssets((prev) => [...prev, newAsset]);
    setIsOptimizing(true);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setAssets((prev) =>
        prev.map((asset) => {
          if (asset.id === newAsset.id && asset.progress < 100) {
            return { ...asset, progress: Math.min(asset.progress + 10, 100) };
          }
          return asset;
        })
      );
    }, 200);

    // After upload, start processing
    setTimeout(() => {
      clearInterval(uploadInterval);
      setAssets((prev) =>
        prev.map((asset) => {
          if (asset.id === newAsset.id) {
            return { ...asset, status: 'processing', progress: 0 };
          }
          return asset;
        })
      );

      // Simulate processing
      const processInterval = setInterval(() => {
        setAssets((prev) =>
          prev.map((asset) => {
            if (asset.id === newAsset.id && asset.progress < 100) {
              return { ...asset, progress: Math.min(asset.progress + 5, 100) };
            }
            return asset;
          })
        );
      }, 300);

      // Complete processing
      setTimeout(() => {
        clearInterval(processInterval);
        setAssets((prev) => {
          const updatedAssets = prev.map((asset) => {
            if (asset.id === newAsset.id) {
              const optimizedAsset = {
                ...asset,
                status: 'optimized' as const,
                progress: 100,
                optimizedSize: asset.size * (1 - optimizationLevel / 100),
                lods: [50000, 25000, 10000, 2500],
              };

              if (onAssetProcessed) {
                onAssetProcessed(optimizedAsset);
              }

              return optimizedAsset;
            }
            return asset;
          });

          const stillProcessing = updatedAssets.some(
            (asset) => asset.status === 'processing' || asset.status === 'uploading'
          );
          if (!stillProcessing) {
            setIsOptimizing(false);
          }

          return updatedAssets;
        });
      }, 6000);
    }, 2000);
  }, [assets, onAssetProcessed, optimizationLevel]);

  // Remove asset
  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
  }, []);

  // Download asset
  const handleDownload = useCallback((asset: Asset & { format?: string }) => {
    const format = asset.format || asset.format;
    const blob = new Blob(['3D Model Content'], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.name.replace(/\.[^/.]+$/, '') + `-optimized.${(format || 'glb').toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
    logger.info('Asset downloaded', { assetId: asset.id, format: format || asset.format });
  }, []);

  // Calculate total reduction
  const totalReduction = assets.reduce((acc, asset) => {
    if (asset.optimizedSize) {
      return acc + (asset.size - asset.optimizedSize);
    }
    return acc;
  }, 0);

  const reductionPercentage = assets.length > 0
    ? Math.round((totalReduction / assets.reduce((acc, a) => acc + a.size, 0)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-gray-900/50 border-blue-500/20 overflow-hidden">
        <div className="p-8">
          <div
            onClick={handleClick}
            className="border-2 border-dashed border-blue-500/30 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500/60 hover:bg-blue-500/5 transition-all"
          >
            <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-white mb-2">
              Cliquez pour uploader un modèle 3D
            </p>
            <p className="text-sm text-gray-400 mb-4">
              ou glissez-déposez votre fichier ici
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {supportedFormats.slice(0, 6).map((format) => (
                <span
                  key={format}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300"
                >
                  {format}
                </span>
              ))}
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                +6 autres
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Max {maxFileSize}MB par fichier
            </p>
          </div>
        </div>
      </Card>

      {/* Optimization Settings */}
      <Card className="bg-gray-900/50 border-purple-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          Paramètres d&apos;Optimisation
        </h3>
        {isOptimizing && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
            <Sparkles className="w-4 h-4 animate-spin" />
            Optimisation en cours… vos modèles sont en traitement.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Réduction Mesh: <span className="text-white font-bold">{optimizationLevel}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="90"
                value={optimizationLevel}
                onChange={(e) => setOptimizationLevel(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Qualité Max</span>
                <span>Légèreté Max</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">
                LOD Levels: <span className="text-white font-bold">{lodLevels}</span>
              </label>
              <input
                type="range"
                min="0"
                max="4"
                value={lodLevels}
                onChange={(e) => setLodLevels(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Génération automatique de niveaux de détail
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-400">
              Optimisations Actives:
            </h4>
            {optimizations.map((opt, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  opt.active
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white font-medium">
                    {opt.name}
                  </span>
                  <span className={`text-xs font-bold ${opt.active ? 'text-green-400' : 'text-gray-500'}`}>
                    {typeof opt.reduction === 'number' ? `-${opt.reduction}%` : opt.reduction}
                  </span>
                </div>
                {opt.active && (
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-green-600 to-blue-600 h-1.5 rounded-full"
                      style={{ width: typeof opt.reduction === 'number' ? `${opt.reduction}%` : '100%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Assets List */}
      {assets.length > 0 && (
        <Card className="bg-gray-900/50 border-green-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-green-400" />
              Assets Traités ({assets.length})
            </h3>
            {reductionPercentage > 0 && (
              <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 font-bold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  -{reductionPercentage}% poids total
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {assets.map((asset) => (
                <motion
                  key={asset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`p-4 rounded-lg border-2 ${
                    asset.status === 'optimized'
                      ? 'border-green-500/30 bg-green-500/5'
                      : asset.status === 'error'
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileType className={`w-5 h-5 ${
                          asset.status === 'optimized' ? 'text-green-400' : 'text-blue-400'
                        }`} />
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {asset.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {asset.format} · {asset.size.toFixed(1)} MB
                            {asset.optimizedSize && (
                              <span className="text-green-400 ml-2">
                                → {asset.optimizedSize.toFixed(1)} MB
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {asset.status !== 'optimized' && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-400">
                              {asset.status === 'uploading' ? 'Upload' : 'Processing'}...
                            </span>
                            <span className="text-white font-medium">{asset.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion
                              className={`h-2 rounded-full ${
                                asset.status === 'uploading'
                                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                                  : 'bg-gradient-to-r from-purple-600 to-pink-600'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${asset.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* LODs Info */}
                      {asset.lods && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {asset.lods.map((lod, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400"
                            >
                              LOD{index}: {(lod / 1000).toFixed(0)}k
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {asset.status === 'optimized' && (
                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400 font-medium">
                            Optimisé
                          </span>
                        </div>
                      )}
                      {asset.status === 'processing' && (
                        <motion
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center gap-2"
                        >
                          <Gauge className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-purple-400 font-medium">
                            Processing
                          </span>
                        </motion>
                      )}
                      <button
                        onClick={() => removeAsset(asset.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Asset Actions (when optimized) */}
                  {asset.status === 'optimized' && (
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-700">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload({ ...asset, format: 'GLB' })}
                        className="border-blue-500/50 hover:bg-blue-500/10 text-xs"
                      >
                        <Download className="mr-1 w-3 h-3" />
                        GLB
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload({ ...asset, format: 'USDZ' })}
                        className="border-purple-500/50 hover:bg-purple-500/10 text-xs"
                      >
                        <Download className="mr-1 w-3 h-3" />
                        USDZ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload({ ...asset, format: 'FBX' })}
                        className="border-green-500/50 hover:bg-green-500/10 text-xs"
                      >
                        <Download className="mr-1 w-3 h-3" />
                        FBX
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          logger.info('CDN deployment', { assetId: asset.id });
                          alert('Déploiement CDN simulé. En production, cela déploierait sur Cloudflare/Cloudinary.');
                        }}
                        className="border-orange-500/50 hover:bg-orange-500/10 text-xs"
                      >
                        <Globe className="mr-1 w-3 h-3" />
                        CDN
                      </Button>
                    </div>
                  )}
                </motion>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary Stats */}
          {assets.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-400">{assets.length}</p>
                <p className="text-xs text-gray-400">Assets</p>
              </div>
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-400">
                  {assets.filter(a => a.status === 'optimized').length}
                </p>
                <p className="text-xs text-gray-400">Optimisés</p>
              </div>
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {totalReduction.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400">MB Économisés</p>
              </div>
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-400">
                  -{reductionPercentage}%
                </p>
                <p className="text-xs text-gray-400">Réduction</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Export Format Selection */}
      <Card className="bg-gray-900/50 border-green-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FileType className="w-5 h-5 text-green-400" />
          Format d&apos;Export
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {exportFormats.map((format) => (
            <div
              key={format.id}
              onClick={() => setSelectedFormat(format.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                selectedFormat === format.id
                  ? `border-${format.color}-500 bg-${format.color}-500/10`
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }`}
            >
              <format.icon className={`w-8 h-8 text-${format.color}-400 mx-auto mb-2`} />
              <p className="text-sm font-medium text-white">{format.name}</p>
              {selectedFormat === format.id && (
                <CheckCircle className="w-4 h-4 text-green-400 mx-auto mt-2" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            disabled={assets.filter(a => a.status === 'optimized').length === 0}
            onClick={() => {
              const optimizedAssets = assets.filter(a => a.status === 'optimized');
              optimizedAssets.forEach(asset => {
                handleDownload({ ...asset, format: selectedFormat.toUpperCase() });
              });
            }}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Download className="mr-2 w-4 h-4" />
            Télécharger Tous ({selectedFormat.toUpperCase()})
          </Button>
          <Button
            disabled={assets.filter(a => a.status === 'optimized').length === 0}
            onClick={() => {
              logger.info('CDN deployment batch', { count: assets.filter(a => a.status === 'optimized').length });
              alert('Déploiement CDN batch simulé. En production, cela déploierait tous les assets sur Cloudflare/Cloudinary.');
            }}
            variant="outline"
            className="border-blue-500/50 hover:bg-blue-500/10"
          >
            <Globe className="mr-2 w-4 h-4" />
            Deploy CDN
          </Button>
        </div>
      </Card>

      {/* Tech Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-blue-500/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">AI Optimization</h4>
              <p className="text-xs text-gray-400">Intelligent</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Réduction mesh avec préservation détails visuels
          </p>
        </Card>

        <Card className="bg-gray-900/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Gauge className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Processing</h4>
              <p className="text-xs text-gray-400">&lt; 2s/asset</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Pipeline ultra-rapide avec BullMQ + Redis
          </p>
        </Card>

        <Card className="bg-gray-900/50 border-green-500/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Batch Mode</h4>
              <p className="text-xs text-gray-400">1000+/heure</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Traitement massif parallèle avec auto-scaling
          </p>
        </Card>
      </div>

      {/* API Example */}
      <Card className="bg-gray-900/50 border-blue-500/20 p-6">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          API Integration:
        </h4>
        <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
          <pre>{`// Upload asset
const formData = new FormData();
formData.append('file', file);

const upload = await fetch('/api/assets/upload', {
  method: 'POST',
  body: formData
});

const { assetId } = await upload.json();

// Optimize
const optimize = await fetch('/api/assets/optimize', {
  method: 'POST',
  body: JSON.stringify({
    assetId,
    options: {
      meshReduction: ${optimizationLevel},
      lodLevels: ${lodLevels},
      textureCompression: 'webp'
    }
  })
});

// Convert & download
const convert = await fetch('/api/assets/convert', {
  method: 'POST',
  body: JSON.stringify({
    assetId,
    format: '${selectedFormat}'
  })
});

const blob = await convert.blob();
// Download or deploy to CDN`}</pre>
        </div>
      </Card>

      {/* Info */}
      {assets.length === 0 && (
        <Card className="bg-blue-500/10 border-blue-500/30 p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-blue-400 font-medium">
                Démo Interactive 3D Asset Hub
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Cliquez sur la zone d&apos;upload pour simuler l&apos;upload d&apos;un modèle 3D.
                Le système va automatiquement optimiser, générer des LODs, et compresser les textures.
                Vous verrez ensuite les options d&apos;export dans tous les formats.
              </p>
              <ul className="space-y-1 text-xs text-gray-400 mt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Support 12+ formats (GLB, FBX, OBJ, USD, STL...)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Optimisation AI avec réduction 50-90%
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  LOD auto-generation (4 niveaux)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Export multi-format (Web, AR, Gaming)
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default memo(AssetHubDemo);


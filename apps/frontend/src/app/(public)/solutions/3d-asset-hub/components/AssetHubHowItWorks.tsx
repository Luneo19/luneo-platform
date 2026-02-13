'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Settings, Zap, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FORMATS, OPTIMIZATIONS } from '../data';

export function AssetHubHowItWorks() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleUploadDemo = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleOptimizeDemo = () => {
    setIsOptimizing(true);
    // Demo simulation - replace with real API in production
    setTimeout(() => setIsOptimizing(false), 1000);
  };

  return (
    <section id="demo-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Essayez Maintenant
          </h2>
          <p className="text-xl text-gray-300">
            Uploadez un modèle 3D et voyez la magie opérer en temps réel
          </p>
        </motion.div>

        <Card className="bg-gray-900/50 border-blue-500/20 p-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-400" />
                Upload Asset
              </h3>
              <div
                className="border-2 border-dashed border-blue-500/30 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500/60 hover:bg-blue-500/5 transition-all"
                onClick={handleUploadDemo}
              >
                <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Cliquez ou glissez votre modèle 3D</p>
                <p className="text-sm text-gray-400 mb-4">
                  GLB, FBX, OBJ, GLTF, USD, STL... (max 500MB)
                </p>
                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-sm text-blue-400">Upload: {uploadProgress}%</p>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Formats Supportés (12+)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.input.map((format) => (
                    <span
                      key={format}
                      className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-6 h-6 text-purple-400" />
                Optimisation
              </h3>
              <div className="space-y-4">
                {OPTIMIZATIONS.map((opt, index) => (
                  <Card
                    key={index}
                    className="bg-gray-800/50 border-gray-700/50 p-4 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{opt.title}</h4>
                        <p className="text-sm text-gray-400">{opt.description}</p>
                      </div>
                      <span className="text-green-400 font-bold text-sm">-{opt.reduction}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 rounded-full"
                        style={{ width: opt.reduction }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                onClick={handleOptimizeDemo}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-6"
              >
                {isOptimizing ? (
                  <>
                    <Gauge className="mr-2 w-5 h-5 animate-spin" />
                    Optimisation en cours...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 w-5 h-5" />
                    Optimiser Maintenant
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-green-400" />
              Export Formats
            </h4>
            <div className="flex flex-wrap gap-2">
              {FORMATS.output.map((format) => (
                <span
                  key={format}
                  className="px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 font-medium"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

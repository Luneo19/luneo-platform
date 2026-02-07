'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Cpu, FileType, Globe, Package, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DEPLOY_TARGETS } from '../data';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Sparkles,
  Package,
};

export function AssetHubDeploy() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Deploy Partout en 1 Clic
          </h2>
          <p className="text-xl text-gray-300">
            Exportez vos assets 3D optimisés vers toutes les plateformes
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {DEPLOY_TARGETS.map((target, index) => {
            const Icon = ICON_MAP[target.iconKey] ?? Globe;
            return (
              <motion.div
                key={target.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-gray-900/50 border-gray-700/50 p-6 text-center hover:border-blue-500/50 hover:bg-gray-900/70 transition-all group cursor-pointer">
                  <Icon className="w-5 h-5 text-blue-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-gray-300">{target.name}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="bg-gray-900/50 border-blue-500/20 p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {[
              { icon: Upload, label: 'Upload', sub: 'GLB, FBX, OBJ...', color: 'blue' },
              { icon: Cpu, label: 'Optimize', sub: 'AI + LODs', color: 'purple' },
              { icon: FileType, label: 'Convert', sub: '15+ formats', color: 'green' },
              { icon: Globe, label: 'Deploy', sub: 'Web, AR, VR', color: 'blue' },
            ].map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.label} className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <StepIcon className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="font-semibold text-white">{step.label}</p>
                  <p className="text-xs text-gray-400">{step.sub}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </section>
  );
}
